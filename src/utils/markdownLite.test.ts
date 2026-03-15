import { describe, expect, it } from 'vitest';
import { renderMarkdownLite, renderPlainText } from './markdownLite';

describe('markdownLite', () => {
  it('escapes plain text before rendering line breaks', () => {
    expect(renderPlainText('<script>alert(1)</script>\nnext line')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;<br />next line'
    );
  });

  it('renders markdown-lite formatting while preserving HTML escaping', () => {
    const rendered = renderMarkdownLite('# Title\n**Bold**\n<script>alert(1)</script>');

    expect(rendered).toContain('<h2>Title</h2>');
    expect(rendered).toContain('<strong>Bold</strong>');
    expect(rendered).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
});
