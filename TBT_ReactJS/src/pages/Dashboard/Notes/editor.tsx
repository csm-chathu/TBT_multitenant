'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type EditorJS from '@editorjs/editorjs'
import type { OutputData } from '@editorjs/editorjs'

export type EditorHandle = {
  save: () => Promise<OutputData | null>
}

type EditorProps = {
  data: OutputData
  onChange: (data: OutputData) => void
}

const Editor = forwardRef<EditorHandle, EditorProps>(function Editor({ data, onChange }, ref) {
  const holderRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<EditorJS | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useImperativeHandle(ref, () => ({
    async save() {
      if (!editorRef.current) return null
      const output = await editorRef.current.save()
      onChangeRef.current(output)
      return output
    },
  }), [])

  const initialDataRef = useRef(data)

  useEffect(() => {
    let destroyed = false
    async function initialize() {
      const [{ default: EditorJS }, { default: Header }, { default: List }, { default: Quote }, { default: Delimiter }] = await Promise.all([
        import('@editorjs/editorjs'),
        import('@editorjs/header'),
        import('@editorjs/list'),
        import('@editorjs/quote'),
        import('@editorjs/delimiter'),
      ])
      if (destroyed || !holderRef.current) return
      const editor = new EditorJS({
        holder: holderRef.current,
        data: initialDataRef.current,
        placeholder: 'Write something...',
        autofocus: true,
        tools: {
          header: { class: Header, inlineToolbar: true, config: { levels: [2, 3, 4], defaultLevel: 2 } },
          list: { class: List, inlineToolbar: true },
          quote: { class: Quote, inlineToolbar: true },
          delimiter: Delimiter,
        },
        async onChange(api: any) {
          const output = await api.saver.save()
          onChangeRef.current(output)
        },
      })
      editorRef.current = editor
    }
    initialize()
    return () => {
      destroyed = true
      if (editorRef.current?.destroy) editorRef.current.destroy()
      editorRef.current = null
    }
  }, [])

  return <div ref={holderRef} className="editor-shell min-h-[360px]" />
})

export default Editor
