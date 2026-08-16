/**
 * Opens a styled popup window with print stylesheets and calls browser print to generate clean vector PDFs.
 */
export const pdfGenerator = {
  download: (title, htmlContent) => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert('Pop-up blocked! Please allow pop-ups to export as PDF.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
            body {
              font-family: 'Plus Jakarta Sans', sans-serif;
              color: #1e293b;
              line-height: 1.5;
              padding: 40px;
              margin: 0;
            }
            h1 {
              font-size: 24px;
              color: #1e3a8a;
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 8px;
              margin-bottom: 20px;
            }
            h2 {
              font-size: 18px;
              color: #4f46e5;
              margin-top: 24px;
              margin-bottom: 12px;
            }
            p {
              margin-bottom: 12px;
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 16px 0;
              font-size: 12px;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 8px 12px;
              text-align: left;
            }
            th {
              background-color: #f1f5f9;
              font-weight: 600;
              color: #0f172a;
            }
            tr:nth-child(even) {
              background-color: #f8fafc;
            }
            ul, ol {
              margin-left: 20px;
              margin-bottom: 12px;
              font-size: 14px;
            }
            li {
              margin-bottom: 4px;
            }
            pre {
              background: #f1f5f9;
              border: 1px solid #e2e8f0;
              padding: 12px;
              border-radius: 6px;
              font-family: monospace;
              font-size: 12px;
              white-space: pre-wrap;
            }
            @media print {
              body {
                padding: 0;
              }
              button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
            <span style="font-size: 12px; color: #64748b; font-weight: bold;">SDD AI Studio</span>
            <button onclick="window.print()" style="padding: 8px 16px; background-color: #3b82f6; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 12px;">Print / Save as PDF</button>
          </div>
          <div>
            ${htmlContent}
          </div>
          <script>
            window.addEventListener('DOMContentLoaded', () => {
              setTimeout(() => {
                window.print();
              }, 500);
            });
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  }
};
