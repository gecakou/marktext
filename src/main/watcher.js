import path from 'path'
import fs from 'fs'
import { promisify } from 'util'
import chokidar from 'chokidar'
import { getUniqueId, log, hasMarkdownExtension } from './utils'
import { loadMarkdownFile } from './utils/filesystem'

const EVENT_NAME = {
  dir: 'AGANI::update-object-tree',
  file: 'AGANI::update-file'
}

const add = async (win, pathname) => {
  const stats = await promisify(fs.stat)(pathname)
  const birthTime = stats.birthtime
  const isMarkdown = hasMarkdownExtension(pathname)
  const file = {
    pathname,
    name: path.basename(pathname),
    isFile: true,
    isDirectory: false,
    birthTime,
    isMarkdown
  }
  if (isMarkdown) {
    const data = await loadMarkdownFile(pathname)
    file.data = data
  }

  win.webContents.send('AGANI::update-object-tree', {
    type: 'add',
    change: file
  })
}

const unlink = (win, pathname, type) => {
  const file = { pathname }
  win.webContents.send(EVENT_NAME[type], {
    type: 'unlink',
    change: file
  })
}

const change = async (win, pathname, type) => {
  const isMarkdown = hasMarkdownExtension(pathname)

  if (isMarkdown) {
    const data = await loadMarkdownFile(pathname)
    const file = {
      pathname,
      data
    }
    win.webContents.send(EVENT_NAME[type], {
      type: 'change',
      change: file
    })
  }
}

const addDir = (win, pathname) => {
  const directory = {
    pathname,
    name: path.basename(pathname),
    isCollapsed: true,
    isDirectory: true,
    isFile: false,
    isMarkdown: false,
    folders: [],
    files: []
  }

  win.webContents.send('AGANI::update-object-tree', {
    type: 'addDir',
    change: directory
  })
}

const unlinkDir = (win, pathname) => {
  const directory = { pathname }
  win.webContents.send('AGANI::update-object-tree', {
    type: 'unlinkDir',
    change: directory
  })
}

class Watcher {
  constructor () {
    this.watchers = {}
  }
  // return a unwatch function
  watch (win, watchPath, type = 'dir'/* file or dir */) {
    const id = getUniqueId()
    const watcher = chokidar.watch(watchPath, {
      ignored: /node_modules|\.git/,
      ignoreInitial: type === 'file',
      persistent: true
    })

    watcher
      .on('add', pathname => add(win, pathname))
      .on('change', pathname => change(win, pathname, type))
      .on('unlink', pathname => unlink(win, pathname, type))
      .on('addDir', pathname => addDir(win, pathname))
      .on('unlinkDir', pathname => unlinkDir(win, pathname))
      .on('error', error => {
        log(`Watcher error: ${error}`)
      })

    this.watchers[id] = {
      win,
      watcher,
      pathname: watchPath,
      type
    }

    // unwatcher function
    return () => {
      if (this.watchers[id]) {
        delete this.watchers[id]
      }
      watcher.close()
    }
  }

  // unWatch some single watch
  unWatch (win, watchPath, type = 'dir') {
    let watcher = null
    let watcherId = null
    for (const id of Object.keys(this.watchers)) {
      const w = this.watchers[id]
      if (
        w.win === win &&
        w.pathname === watchPath &&
        w.type === type
      ) {
        watcher = w.watcher
        watcherId = id
        break
      }
    }
    if (watcher) {
      delete this.watchers[watcherId]
      watcher.close()
    }
  }

  // unwatch for ome window, (remove all the watchers in one window)
  unWatchWin (win) {
    const watchers = []
    const watchIds = []
    for (const id of Object.keys(this.watchers)) {
      const w = this.watchers[id]
      if (w.win === win) {
        watchers.push(w.watcher)
        watchIds.push(id)
      }
    }
    if (watchers.length) {
      watchIds.forEach(id => delete this.watchers[id])
      watchers.forEach(watcher => watcher.close())
    }
  }

  clear () {
    Object.keys(this.watchers).forEach(id => this.watchers[id].watcher.close())
  }
}

export default Watcher
