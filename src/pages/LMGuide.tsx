import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import guideContent from '../guides/test-report-writing.md?raw'

export function LMGuide() {
  return (
    <div className="bg-white p-6 rounded shadow-sm max-w-4xl mx-auto">
      <div className="prose prose-slate max-w-none
        prose-headings:font-bold
        prose-h1:text-2xl prose-h1:mb-4 prose-h1:mt-0
        prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-h2:border-b prose-h2:pb-2
        prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-2
        prose-h4:text-base prose-h4:mt-4 prose-h4:mb-2
        prose-p:my-3
        prose-li:my-1
        prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
        prose-pre:bg-slate-900 prose-pre:text-slate-100
        prose-table:text-sm
        prose-th:bg-slate-100 prose-th:text-left prose-th:p-2 prose-th:border
        prose-td:p-2 prose-td:border prose-td:align-top
        prose-blockquote:border-l-4 prose-blockquote:border-slate-300 prose-blockquote:pl-4 prose-blockquote:italic
        prose-a:text-slate-700 prose-a:underline
      ">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {guideContent}
        </ReactMarkdown>
      </div>
    </div>
  )
}
