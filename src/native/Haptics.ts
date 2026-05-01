import {NativeModules} from 'react-native';

const {InstrumentHaptics} = NativeModules;

/** Light tick — for scrolls, toggles, minor interactions */
export function tick(): void {
  InstrumentHaptics?.tick();
}

/** Medium click — for button presses, selections */
export function impact(): void {
  InstrumentHaptics?.impact();
}

/** Heavy click — for destructive actions, confirmations */
export function heavy(): void {
  InstrumentHaptics?.heavy();
}
