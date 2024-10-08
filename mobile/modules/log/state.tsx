// withHooks
// noPage

import { LibObject } from 'esoftplay/cache/lib/object/import';
import { LogFeatureProperty } from 'esoftplay/cache/log/feature/import';
import { LogFeature_recordProperty } from 'esoftplay/cache/log/feature_record/import';
import { LogReporter } from 'esoftplay/cache/log/reporter/import';
import esp from 'esoftplay/esp';
import useGlobalState, { useGlobalReturn } from 'esoftplay/global';

import moment from 'esoftplay/moment';
import { } from 'react-native';


export interface LogStateArgs {

}
export interface LogStateProps {

}

const _state = useGlobalState([], { persistKey: 'lib_apitest', inFile: true, loadOnInit: true })
export function state(): useGlobalReturn<any> {
  return _state
}

const stateIsDebug = useGlobalState(false, { persistKey: 'lib_apitest_debug' })
export function enableLog(): useGlobalReturn<any> {
  return stateIsDebug
}

function doRepairUrl(url: string) {
  let repaired = url.split('/')
  if (repaired.length > 1) {
    const lastIdx = repaired.length - 1
    const uriParam = repaired[lastIdx].split("?")[0]
    const fixGET = repaired[lastIdx].split('?').join('&')

    if (!isNaN(Number(uriParam))) {
      url = repaired.slice(0, lastIdx).join('/')
      url += "?id=" + [fixGET];
    }
  }
  return url
}

function fixUrl(url: string) {
  let fullUrl = url
  const nurl = url.replace(/(https?:\/\/)/g, '')
  const spath = nurl.split('/').slice(1, nurl.length - 1).join('/')
  let host = nurl.split('/')[0] + '/'
  let path = doRepairUrl(spath)
  fullUrl = host + path

  return fullUrl
}

function formatSizeUnits(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  } else if (bytes >= 1024) {
    return (bytes / 1024).toFixed(2) + ' KB';
  } else {
    return bytes + ' bytes';
  }
}

export function doLogCurl(uri: string, url: string, post: any, isSecure: boolean, response: any, module?: string) {
  LogReporter?.addLog?.(url + uri, post, response)
  const logEnable = enableLog().get()
  if (!!esp.config('log')?.enable && logEnable) {
    const allData = state().get() || []

    const fullURL = url + uri
    let uriOrigin = ''

    if (fullURL != '') {
      const urls = fixUrl(fullURL)
      uriOrigin = urls.replace(/(https?:\/\/)/g, '')
      let uriArray = uriOrigin.split('/')
      let uri = uriArray.slice(1, uriArray.length - 1).join('/')
      let get = uriArray[uriArray.length - 1];
      let newURI = uri != "" ? uri + '/' : uri
      uriOrigin = newURI + get
    }
    const complete_uri = uriOrigin
    const _uri = complete_uri.includes('?') ? complete_uri.split('?')[0] : complete_uri
    const _get = complete_uri.includes('?') ? complete_uri.split('?')[1].split('&').map((x: any) => x.split('=')).map((t: any) => {
      return ({ [t[0]]: [t[1]] })
    }) : []
    const get = Object.assign({}, ..._get)
    const _post = post && Object.keys(post).map((key) => {
      return ({ [key]: [decodeURIComponent(post[key])] })
    }) || []
    const postNew = Object.assign({}, ..._post)

    if (_uri != '') {
      const responseJSON = JSON.stringify(response);
      const responseSize = new TextEncoder().encode(responseJSON).length;

      const data = {
        [_uri]: {
          module: module,
          secure: isSecure,
          time: moment().format('YYYY-MM-DD HH:mm:ss'),
          get: get,
          post: postNew,
          response: response,
          size: formatSizeUnits(responseSize)
        }
      }
      let dt = LibObject.unshift(allData, data)()
      /* start record feature */
      if (!!LogFeature_recordProperty.recordState.get()) {
        const key = LogFeature_recordProperty.recordedKey.get()
        LogFeatureProperty.state().set((old: any) => LibObject.push(old, data)(key))
      }
      /* end of record feature */
      state().set(dt)
    }
  }
}

export default function m(props: LogStateProps): any {
  return null
}