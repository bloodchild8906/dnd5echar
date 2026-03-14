const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export const renderMarkdownLite = (value: string): string => {
  let output = escapeHtml(value);
  output = output.replace(/^### (.*)$/gm, '<h4>$1</h4>');
  output = output.replace(/^## (.*)$/gm, '<h3>$1</h3>');
  output = output.replace(/^# (.*)$/gm, '<h2>$1</h2>');
  output = output.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  output = output.replace(/\*(.*?)\*/g, '<em>$1</em>');
  output = output.replace(/^- (.*)$/gm, '<li>$1</li>');
  output = output.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  output = output.replace(/\n/g, '<br />');
  return output;
};
