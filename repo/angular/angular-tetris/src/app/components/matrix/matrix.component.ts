import { GameState } from '@angular-tetris/interface/game-state';
import { Tile } from '@angular-tetris/interface/tile/tile';
import { MatrixUtil } from '@angular-tetris/interface/utils/matrix';
import { TetrisStateService } from '@angular-tetris/state/tetris/tetris.state';
import { AsyncPipe, NgFor } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, combineLatest, of, timer } from 'rxjs';
import { map, switchMap, takeWhile } from 'rxjs/operators';
import { TileComponent } from '../tile/tile.component';

@UntilDestroy()
@Component({
  selector: 't-matrix',
  standalone: true,
  imports: [TileComponent, NgFor, AsyncPipe],
  templateUrl: './matrix.component.html',
  styleUrls: ['./matrix.component.scss']
})
export class MatrixComponent implements OnInit {
  private tetrisState = inject(TetrisStateService);

  matrix$: Observable<Tile[]>;
  filledCount$: Observable<number>;

  ngOnInit(): void {
    this.matrix$ = this.getMatrix();
    this.filledCount$ = this.matrix$.pipe(
      map((tiles) => (tiles || []).filter((tile) => tile.isFilled).length)
    );
  }

  getMatrix(): Observable<Tile[]> {
    return combineLatest([this.tetrisState.gameState$, this.tetrisState.matrix$]).pipe(
      untilDestroyed(this),
      switchMap(([gameState, matrix]) => {
        if (gameState !== GameState.Over && gameState !== GameState.Loading) {
          return of(matrix);
        }
        const newMatrix = [...matrix];
        const rowsLength = MatrixUtil.Height * 2;
        const animatedMatrix$: Observable<Tile[]> = timer(0, rowsLength).pipe(
          map((x) => x + 1),
          takeWhile((x) => x <= rowsLength + 1),
          switchMap((idx) => {
            const gridIndex = idx - 1;
            if (gridIndex < MatrixUtil.Height) {
              newMatrix.splice(
                gridIndex * MatrixUtil.Width,
                MatrixUtil.Width,
                ...MatrixUtil.FullRow
              );
            }

            return of(newMatrix);
          })
        );
        return animatedMatrix$;
      })
    );
  }
}
