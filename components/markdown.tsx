// 마크다운 → HTML 렌더링.
// react-markdown은 기본적으로 HTML 태그를 그대로 실행하지 않아서
// 누가 <script>를 써넣어도 안전해 (XSS 방지).
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // 표, 취소선, 체크박스 지원

export default function Markdown({ children }: { children: string }) {
  return (
    <div className="wiki-content">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
