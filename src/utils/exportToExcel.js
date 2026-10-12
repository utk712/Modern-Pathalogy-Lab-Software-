// Client-side Excel & CSV Export Utility for Diagnostic & Financial Records

export const exportToExcel = (data, filename = 'export', columns = null) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    alert('No data available to export.');
    return false;
  }

  try {
    // UTF-8 BOM so Excel opens accented characters and symbols cleanly
    let csvContent = '\uFEFF';

    // Determine Headers and Accessor Keys
    const headers = columns
      ? columns.map(c => c.label)
      : Object.keys(data[0]);

    const keys = columns
      ? columns.map(c => c.key)
      : Object.keys(data[0]);

    // Add Header Row
    csvContent += headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(',') + '\r\n';

    // Add Data Rows
    data.forEach(row => {
      const rowValues = keys.map(k => {
        let val;
        if (typeof k === 'function') {
          val = k(row);
        } else if (typeof k === 'string') {
          // Support dot notation like 'billing.grossTotal'
          val = k.split('.').reduce((obj, key) => (obj && obj[key] !== undefined ? obj[key] : ''), row);
        } else {
          val = row[k];
        }

        if (val === undefined || val === null) val = '';
        if (Array.isArray(val)) val = val.join(', ');

        return `"${String(val).replace(/"/g, '""')}"`;
      });

      csvContent += rowValues.join(',') + '\r\n';
    });

    // Create Blob and trigger immediate browser file download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const todayStr = new Date().toISOString().split('T')[0];

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (err) {
    console.error('Export Error:', err);
    alert('Failed to export file. Please check browser permissions.');
    return false;
  }
};

export const exportToTallyXML = (patients, filename = 'Tally_Vouchers') => {
  if (!patients || patients.length === 0) {
    alert('No patient invoices available to export for Tally.');
    return false;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
`;

  patients.forEach(p => {
    const gross = p.billing?.grossTotal || 400;
    const paid = p.billing?.paidAmount ?? gross;
    const invoiceNo = p.billing?.invoiceNo || `INV-${p.labCode || p.uhid}`;
    
    xml += `        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Sales" ACTION="Create">
            <DATE>${todayStr.replace(/-/g, '')}</DATE>
            <VOUCHERTYPENAME>Diagnostic Sales</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${invoiceNo}</VOUCHERNUMBER>
            <PARTYLEDGERNAME>${p.name.replace(/&/g, '&amp;')}</PARTYLEDGERNAME>
            <NARRATION>Pathology Lab Code: ${p.labCode || p.uhid} - ${p.referringDoctor || 'Self'}</NARRATION>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Diagnostic Income</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>-${gross}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Cash / Bank</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>${paid}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
`;
  });

  xml += `      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${todayStr}.xml`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
};
