import { configureStore } from '@reduxjs/toolkit'
import { createEpicMiddleware } from 'redux-observable'
import {
  isProd,
  localstorageName,
  localstorageVersionName,
} from '@/constants/devSettings'
import { RootActionType } from '@/types/actionObj'
import { RootStateType } from '@/types/state'
import rootReducer from './reducers'

export const epicMiddleware = createEpicMiddleware<
  RootActionType,
  RootActionType,
  RootStateType
>()

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(epicMiddleware),
  devTools: !isProd,
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// RepairBench instrumentation IN-1: one single-publish, strictly READ-ONLY observation
// bridge. It is additive (no application code path, condition, constant or ordering is
// touched), it publishes at most once per document, and every accessor is fail-close:
// if anything throws, the accessor returns its neutral fallback (false / null) instead
// of propagating, so a probe can never break the app it observes. It deliberately does
// NOT expose `dispatch` or any setter: the bridge can only be read.
;(function publishRepairBenchProbe() {
  try {
    if (typeof window === 'undefined') {
      return
    }
    const w = window as unknown as { __rb?: unknown }
    if (w.__rb !== undefined) {
      return
    }
    const read = <T,>(fn: () => T, fallback: T): T => {
      try {
        return fn()
      } catch (e) {
        return fallback
      }
    }
    w.__rb = Object.freeze({
      version: 'arcomage-hd-rb1',
      // true only once the real render path has produced the app root AND the store
      // holds every slice the checkpoints read
      ready: (): boolean =>
        read(() => {
          const s = store.getState()
          return (
            !!s &&
            !!s.status &&
            !!s.status.player &&
            !!s.status.opponent &&
            !!s.settings &&
            !!s.cards &&
            !!s.screen &&
            !!s.game &&
            !!s.visual &&
            !!s.sound &&
            !!s.lang &&
            !!s.ai &&
            !!s.multiplayer &&
            document.querySelector('[data-testid="rb-root"]') !== null
          )
        }, false),
      state: () => read(() => store.getState(), null),
      ls: () => read(() => window.localStorage.getItem(localstorageName), null),
      lsVersion: () =>
        read(() => window.localStorage.getItem(localstorageVersionName), null),
      lsKeys: () =>
        read(() => Object.keys(window.localStorage).sort().join(','), ''),
    })
  } catch (e) {
    // fail-close: an uninstallable probe must not take the application down
  }
})()
