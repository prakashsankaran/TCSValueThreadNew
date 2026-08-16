/**
 * Exports JSON arrays to Excel-compatible CSV downloads.
 */
export const excelGenerator = {
  download: (filename, data) => {
    if (!data || !data.length) return;
    
    // Extract headers
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Push headers row
    csvRows.push(headers.map(header => `"${header.replace(/"/g, '""')}"`).join(','));
    
    // Push data rows
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header] === undefined || row[header] === null ? '' : String(row[header]);
        return `"${val.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
