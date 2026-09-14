package xlsx

import (
	"encoding/csv"
	"fmt"
	"log"
	"os"
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"unicode"

	"gowebview/lib"

	"github.com/xuri/excelize/v2"
)

type IXLSX interface {
	QueryTranslation(textDTO map[string]interface{}) map[string]interface{}
	SaveText(textDTO map[string]interface{}) interface{}
}

type XLSX struct{}

var APPDATA = os.Getenv("appdata")
var settingsDir = path.Join(APPDATA, "ai-translate")
var file_name string
var workbook *excelize.File

func isFile(rawPath string) bool {
	var path = filepath.Clean(rawPath)
	info, err := os.Stat(path)
	if err != nil {
		return false // o arquivo não existe ou houve erro ao acessar
	}
	return !info.IsDir() // se não é diretório, é arquivo
}

func loadFile(name string) {
	file_name = name
	file, err := excelize.OpenFile(myFilePath())
	if err == nil {
		workbook = file
	} else {
		workbook = excelize.NewFile()
		workbook.SetSheetName("Sheet1", sheetName())
		err := workbook.SaveAs(myFilePath())
		if err != nil {
			log.Println("Error while saving file: ", err)
		}
	}

}

func myFilePath() string {
	xlsxRawPath := filepath.Join(settingsDir, file_name+".xlsx")
	csvRawPath := filepath.Join(settingsDir, file_name+".csv")
	if isFile(csvRawPath) && !isFile(xlsxRawPath) {
		csvToXlsx(csvRawPath, xlsxRawPath)
	}
	cleanPath := filepath.Clean(xlsxRawPath)
	return sanitizePath(cleanPath)
}

func csvToXlsx(csvRawPath, xlsxRawPath string) (string, error) {
	xlsxPath := filepath.Clean(xlsxRawPath)
	csvFile, err := os.Open(filepath.Clean(csvRawPath))
	if err != nil {
		return "", fmt.Errorf("erro ao abrir o CSV: %w", err)
	}
	defer csvFile.Close()

	reader := csv.NewReader(csvFile)
	records, err := reader.ReadAll()
	if err != nil {
		return "", fmt.Errorf("erro ao ler o CSV: %w", err)
	}

	f := excelize.NewFile()
	sheet := f.GetSheetName(0)
	for rowIndex, row := range records {
		for colIndex, cellValue := range row {
			cellRef, err := excelize.CoordinatesToCellName(colIndex+1, rowIndex+1)
			if err != nil {
				return "", fmt.Errorf("erro ao converter coordenadas: %w", err)
			}
			if err := f.SetCellValue(sheet, cellRef, cellValue); err != nil {
				return "", fmt.Errorf("erro ao definir valor da célula: %w", err)
			}
		}
	}

	if err := f.SaveAs(xlsxPath); err != nil {
		return "", fmt.Errorf("erro ao salvar o arquivo XLSX: %w", err)
	}

	return xlsxPath, nil
}

func sheetName() string { return "Translation" }

func queryEntry(textDTO map[string]interface{}) int {
	if textDTO == nil {
		return -1
	}
	window_title, ok := textDTO["window_title"].(string)
	originalText, ok2 := textDTO["originalText"].(string)
	if ok && ok2 {
		loadFile(window_title)
		cols, err := workbook.GetCols(sheetName())
		if err == nil && len(cols) > 0 {
			for i, cell := range cols[0] {
				if originalText == cell {
					return i + 1
				}
			}
		}
	}

	return -1
}

func getHistory(lastRowNumber int) []string {
	history := make([]string, 0)
	rowNumber := lastRowNumber
	rows, GetRowsError := workbook.GetRows(sheetName())
	if GetRowsError != nil {
		log.Println("Error on getHistory: Failed to get sheet's rows.")
		return history
	}
	for len(history) < 10 {
		rowNumber = rowNumber - 1
		if (rowNumber) > 0 {
			cellname, GetCellNameError := excelize.CoordinatesToCellName(len(rows[rowNumber])-1, rowNumber)
			if GetCellNameError != nil {
				log.Println("Error on getHistory: Failed to get sheet's name.")
			}
			value, err := workbook.GetCellValue(sheetName(), cellname)
			if err == nil && value != "" {
				history = append(history, value)
			}
		} else {
			break
		}
	}

	lib.ReverseSlice(history)
	return history
}

func (X XLSX) QueryTranslation(textDTO map[string]interface{}) map[string]interface{} {
	if textDTO == nil {
		return textDTO
	}
	defer func() {
		if workbook != nil {
			if err := workbook.Close(); err != nil {
				log.Printf("Error on QueryTranslation: failed to close the workbook: %v", err)
			}
		}
	}()

	var e = queryEntry(textDTO)
	rows, err := workbook.GetRows(sheetName())
	if e != -1 {
		if err == nil {
			textDTO["history"] = getHistory(e)
			textDTO["translatedText"] = rows[e][1:]

		} else {
			log.Printf(`Error on QueryTranslation: failed to get cell's value: %v`, err)
		}

	} else {
		if err == nil {
			textDTO["history"] = getHistory(len(rows) + 1)
		}
	}

	return textDTO
}

func (X XLSX) SaveText(textDTO map[string]interface{}) interface{} {
	defer func() {
		if workbook != nil {
			if err := workbook.Close(); err != nil {
				log.Printf("Error on SaveText: failed to close the workbook: %v", err)
			}
		}
	}()

	var e = queryEntry(textDTO)
	var originalText, ok = textDTO["originalText"].(string)
	var translatedText, ok2 = textDTO["translatedText"].(string)
	rows, GetRowsError := workbook.GetRows(sheetName())
	if e != -1 && ok && ok2 {
		var row = rows[e]
		var cellName, GetCellNameError = excelize.CoordinatesToCellName(len(row), e)
		if GetCellNameError == nil {
			workbook.SetCellValue(sheetName(), cellName, translatedText)
		}

	} else if ok && ok2 && GetRowsError == nil {
		newRowNumber := len(rows) + 1
		newRowStr := strconv.Itoa(newRowNumber)
		err := workbook.SetCellValue(sheetName(), "A"+newRowStr, originalText)
		err2 := workbook.SetCellValue(sheetName(), "B"+newRowStr, translatedText)
		err3 := workbook.Save()

		if err != nil || err2 != nil || err3 != nil {
			return map[string]string{
				"error": "failed to save text",
			}
		}
	} else if GetRowsError != nil {
		log.Printf("Failed to save text: Error while getting sheet's rows.")
	}

	return nil
}

func sanitizePath(path string) string {
	var sanitizedPath strings.Builder
	for _, r := range path {
		if unicode.IsPrint(r) && !unicode.IsControl(r) {
			sanitizedPath.WriteRune(r)
		}
	}
	return sanitizedPath.String()
}
