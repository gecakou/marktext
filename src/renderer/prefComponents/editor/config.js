import { ENCODING_NAME_MAP } from 'common/encoding'

export const endOfLineOptions = [{
  label: 'Default',
  value: 'default'
}, {
  label: 'Carriage return and line feed (CRLF)',
  value: 'crlf'
}, {
  label: 'Line feed (LF)',
  value: 'lf'
}]

export const trimTrailingNewlineOptions = [{
  label: 'Trim all trailing',
  value: 0
}, {
  label: 'Ensure a single one',
  value: 1
}, {
  label: 'Detect trailing style',
  value: 2
}, {
  label: 'Do nothing',
  value: 3
}]

export const textDirectionOptions = [{
  label: 'Left to Right',
  value: 'ltr'
}, {
  label: 'Right to Left',
  value: 'rtl'
}]

let defaultEncodingOptions = null
export const getDefaultEncodingOptions = () => {
  if (defaultEncodingOptions) {
    return defaultEncodingOptions
  }

  defaultEncodingOptions = []
  for (const [value, label] of Object.entries(ENCODING_NAME_MAP)) {
    defaultEncodingOptions.push({ label, value })
  }
  return defaultEncodingOptions
}
