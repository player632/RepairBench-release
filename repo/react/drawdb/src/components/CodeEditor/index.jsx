import { useState } from "react";
import { useSettings } from "../../hooks";
import { Button } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { IconCopy, IconTick } from "@douyinfe/semi-icons";

export default function CodeEditor({
  showCopyButton,
  extraControls,
  filename,
  className = "",
  ...props
}) {
  const { settings } = useSettings();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard
      .writeText(props.value ?? "")
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      })
      .catch((e) => console.error(e));
  };

  const readOnly =
    props.readOnly === true ||
    (props.options && props.options.readOnly === true) ||
    typeof props.onChange !== "function";

  const heightStyle =
    props.height == null
      ? undefined
      : {
          height:
            typeof props.height === "number"
              ? props.height + "px"
              : props.height,
        };

  return (
    <div className={"relative h-full flex flex-col " + className}>
      {filename && (
        <div
          className={
            "px-4 py-2 rounded-t-md text-xs flex justify-between items-center " +
            (settings.mode === "dark"
              ? "bg-neutral-800 text-gray-50"
              : "bg-gray-100 text-gray-800")
          }
        >
          <div>{filename}</div>
          <button
            onClick={copyCode}
            className="flex items-center gap-1 hover:opacity-80"
          >
            <i
              className={"bi " + (copied ? "bi-check2" : "bi-copy") + " me-1"}
            />
            {t("copy")}
          </button>
        </div>
      )}
      <textarea
        data-testid={props["data-testid"]}
        className="w-full flex-1 resize-none rounded-b-md border p-4 font-mono text-sm outline-none bg-white text-zinc-800 dark:bg-neutral-900 dark:text-gray-100"
        style={heightStyle}
        value={props.value ?? ""}
        placeholder={props.placeholder}
        readOnly={readOnly}
        spellCheck={false}
        onChange={
          readOnly || typeof props.onChange !== "function"
            ? undefined
            : (e) => props.onChange(e.target.value)
        }
      />
      {showCopyButton && (
        <div className="absolute flex flex-col right-6 bottom-2 z-10 space-y-2">
          {extraControls}
          <Button
            icon={copied ? <IconTick /> : <IconCopy />}
            onClick={copyCode}
            className="inline-block"
          />
        </div>
      )}
    </div>
  );
}
