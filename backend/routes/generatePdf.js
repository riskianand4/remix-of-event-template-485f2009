const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const PSBActivation = require('../models/PSBActivation');
const { auth } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

// Load logo as base64 once at startup
let logoBase64 = '';
try {
  const logoPath = path.join(__dirname, '..', '..', 'public', 'TitlePdfReport', 'TelnetFiber.png');
  if (fs.existsSync(logoPath)) {
    const logoBuffer = fs.readFileSync(logoPath);
    logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  }
} catch (e) {
  console.warn('Logo not found, PDF will render without logo');
}

// Generate PDF for PSB Activation
router.post('/:id/generate-pdf', auth, async (req, res) => {
  let browser = null;
  try {
    const { id } = req.params;
    const { formData = {}, signatures = {} } = req.body;

    // Get activation from database
    const activation = await PSBActivation.findById(id);
    if (!activation) {
      return res.status(404).json({ error: 'Activation not found' });
    }

    // Merge form data with DB data (form data takes priority)
    const report = activation.installationReport || {};
    const mergedData = {
      customerName: activation.customerName || '',
      serviceNumber: activation.serviceNumber || '',
      pppoeUsername: activation.pppoeUsername || '',
      pppoePassword: activation.pppoePassword || '',
      oltName: activation.oltName || '',
      ponPort: activation.ponPort || '',
      onuNumber: activation.onuNumber || '',
      signalLevel: activation.signalLevel || '',
      cluster: activation.cluster || '',
      technician: activation.technician || '',
      activationDate: activation.activationDate || new Date(),
      // Form data overrides
      downloadSpeed: formData.downloadSpeed || report.speedTest?.download || '',
      uploadSpeed: formData.uploadSpeed || report.speedTest?.upload || '',
      ping: formData.ping || report.speedTest?.ping || '',
      serviceType: formData.serviceType || report.serviceType || '',
      packageSpeed: formData.packageSpeed || report.packageSpeed || '',
      fastelNumber: formData.fastelNumber || report.fastelNumber || '',
      contactPerson: formData.contactPerson || report.contactPerson || '',
      ontType: formData.ontType || report.device?.ontType || '',
      ontSerial: formData.ontSerial || report.device?.ontSerial || '',
      routerType: formData.routerType || report.device?.routerType || '',
      routerSerial: formData.routerSerial || report.device?.routerSerial || '',
      stbId: formData.stbId || report.device?.stbId || '',
      area: formData.area || report.datek?.area || '',
      odc: formData.odc || report.datek?.odc || '',
      odp: formData.odp || report.datek?.odp || '',
      port: formData.port || report.datek?.port || '',
      dc: formData.dc || report.datek?.dc || '',
      soc: formData.soc || report.datek?.soc || '',
      technicianSignature: signatures.technician || report.signatures?.technician || '',
      customerSignature: signatures.customer || report.signatures?.customer || '',
    };

    const date = new Date(mergedData.activationDate);
    const day = date.getDate();
    const month = date.toLocaleString('id-ID', { month: 'long' });
    const year = date.getFullYear();
    const cityDate = mergedData.cluster || '...';

    // Checkbox helpers
    const chk = (condition) => condition ? 'checked' : '';
    const val = (v) => v || '';

    const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: A4; margin: 12mm 15mm 15mm 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: "Times New Roman", Times, serif;
      color: #000;
      font-size: 12px;
      line-height: 1.4;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .container { width: 100%; padding: 0; }
    .header { text-align: center; margin-bottom: 12px; }
    .logo-img { height: 80px; display: block; margin: 0 auto 2px; }
    .title { font-size: 15px; font-weight: bold; text-decoration: underline; letter-spacing: 0.5px; }

    .section { margin-bottom: 8px; }
    .section-title { font-weight: bold; font-size: 12px; margin-bottom: 4px; }

    .checkbox-group {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 3px; margin-bottom: 6px; padding-left: 80px;
    }
    .checkbox-item { display: flex; align-items: center; gap: 6px; font-size: 11px; }
    .checkbox-item input[type="checkbox"] { width: 12px; height: 12px; margin: 0; }

    .date-text { margin: 8px 0; line-height: 1.5; font-size: 12px; }
    .date-val { display: inline; font-weight: normal; border-bottom: 1px dotted #999; padding: 0 4px; min-width: 50px; }

    .form-row { display: flex; align-items: baseline; margin-bottom: 1px; min-height: 20px; }
    .form-label { width: 220px; font-size: 11px; flex-shrink: 0; }
    .form-colon { width: 15px; text-align: center; flex-shrink: 0; }
    .form-value { flex: 1; display: flex; align-items: center; gap: 8px; }
    .form-text {
      flex: 1; padding: 1px 4px; font-size: 12px;
      font-family: "Times New Roman", Times, serif;
      border-bottom: 1px solid #000; min-height: 18px;
    }
    .form-text-empty { border-bottom: 1px dotted #999; color: transparent; }

    .speed-option { display: flex; align-items: center; gap: 4px; font-size: 10px; white-space: nowrap; }
    .speed-option input[type="checkbox"] { width: 11px; height: 11px; margin: 0; }

    table { width: 100%; border-collapse: collapse; margin: 6px 0; }
    table th, table td { border: 1px solid #000; padding: 4px 3px; text-align: center; font-size: 10px; }
    table th { background: #e8e8e8; font-weight: bold; }
    table td { min-height: 22px; }

    .disclaimer { margin-top: 8px; font-size: 10px; line-height: 1.4; }
    .disclaimer-title { font-weight: bold; margin-bottom: 3px; font-size: 11px; }
    .disclaimer ol { padding-left: 18px; list-style-type: decimal; margin: 0; }
    .disclaimer li { font-weight: bold; font-size: 10px; line-height: 1.3; margin-bottom: 3px; }

    .closing-text { margin-top: 10px; font-size: 11px; line-height: 1.5; }

    .signature-section {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-top: 20px; position: relative;
    }
    .signature-date { position: absolute; right: 50px; top: -18px; font-size: 11px; }
    .signature-box { width: 44%; text-align: center; }
    .signature-title { font-size: 11px; margin-bottom: 3px; }
    .signature-space { height: 65px; display: flex; align-items: center; justify-content: center; }
    .signature-image { max-width: 140px; max-height: 55px; object-fit: contain; }
    .signature-name { font-size: 11px; font-weight: bold; margin-top: 3px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${logoBase64 ? `<img src="${logoBase64}" class="logo-img" alt="TelNet Fiber" />` : '<div style="font-size:20px;font-weight:bold;color:#2196F3;margin-bottom:8px;">TelNet Fiber</div>'}
      <div class="title">BERITA ACARA INSTALASI</div>
    </div>

    <div class="section">
      <div class="section-title">LAYANAN :</div>
      <div class="checkbox-group">
        <div class="checkbox-item"><input type="checkbox" checked><label>TELNET HOME</label></div>
        <div class="checkbox-item"><input type="checkbox"><label>TELNET DEDICATED</label></div>
        <div class="checkbox-item"><input type="checkbox"><label>VPN IP</label></div>
        <div class="checkbox-item"><input type="checkbox" checked><label>GPON</label></div>
        <div class="checkbox-item"><input type="checkbox"><label>IPTV</label></div>
        <div class="checkbox-item"><input type="checkbox"><label>EPON</label></div>
      </div>
    </div>

    <div class="date-text">
      Pada hari ini, tanggal <span class="date-val">${day}</span>, bulan <span class="date-val">${month}</span>, tahun <span class="date-val">${year}</span>. Telah dilakukan instalasi sesuai layanan diatas, dengan data dan hasil berikut :
    </div>

    <div class="form-row">
      <span class="form-label">Jenis Layanan</span>
      <span class="form-colon">:</span>
      <div class="form-value" style="gap:6px;flex-wrap:wrap;">
        <div class="speed-option"><input type="checkbox" ${chk(mergedData.serviceType === 'pasang_baru')}><label>Pasang Baru</label></div>
        <div class="speed-option"><input type="checkbox" ${chk(mergedData.serviceType === 'cabut')}><label>Cabut</label></div>
        <div class="speed-option"><input type="checkbox" ${chk(mergedData.serviceType === 'upgrade')}><label>Upgrade</label></div>
        <div class="speed-option"><input type="checkbox" ${chk(mergedData.serviceType === 'downgrade')}><label>Downgrade</label></div>
        <div class="speed-option"><input type="checkbox" ${chk(mergedData.serviceType === 'pda')}><label>PDA</label></div>
      </div>
    </div>

    <div class="form-row">
      <span class="form-label">Paket Layanan</span>
      <span class="form-colon">:</span>
      <div class="form-value" style="gap:6px;flex-wrap:wrap;">
        <div class="speed-option"><input type="checkbox" ${chk(String(mergedData.packageSpeed) === '20')}><label>20 Mbps</label></div>
        <div class="speed-option"><input type="checkbox" ${chk(String(mergedData.packageSpeed) === '30')}><label>30 Mbps</label></div>
        <div class="speed-option"><input type="checkbox" ${chk(String(mergedData.packageSpeed) === '40')}><label>40 Mbps</label></div>
        <div class="speed-option"><input type="checkbox" ${chk(String(mergedData.packageSpeed) === '50')}><label>50 Mbps</label></div>
        <div class="speed-option"><input type="checkbox" ${chk(String(mergedData.packageSpeed) === '100')}><label>100 Mbps</label></div>
      </div>
    </div>

    <div class="form-row">
      <span class="form-label">BW (Mbps) Speed Test Download</span>
      <span class="form-colon">:</span>
      <div class="form-value">
        <span class="form-text ${val(mergedData.downloadSpeed) ? '' : 'form-text-empty'}" style="max-width:100px">${val(mergedData.downloadSpeed) || '.'}</span>
        <span style="font-size:11px">Mbps</span>
      </div>
    </div>

    <div class="form-row">
      <span class="form-label">BW (Mbps) Speed Test Upload</span>
      <span class="form-colon">:</span>
      <div class="form-value">
        <span class="form-text ${val(mergedData.uploadSpeed) ? '' : 'form-text-empty'}" style="max-width:100px">${val(mergedData.uploadSpeed) || '.'}</span>
        <span style="font-size:11px">Mbps</span>
      </div>
    </div>

    <div class="form-row">
      <span class="form-label">Nama Pelanggan</span>
      <span class="form-colon">:</span>
      <div class="form-value"><span class="form-text">${val(mergedData.customerName)}</span></div>
    </div>

    <div class="form-row">
      <span class="form-label">Alamat (Dipasang / Alamat Baru)</span>
      <span class="form-colon">:</span>
      <div class="form-value"><span class="form-text">${val(mergedData.cluster)}</span></div>
    </div>

    <div class="form-row">
      <span class="form-label">Nomor FASTEL</span>
      <span class="form-colon">:</span>
      <div class="form-value"><span class="form-text ${val(mergedData.fastelNumber) ? '' : 'form-text-empty'}">${val(mergedData.fastelNumber) || '.'}</span></div>
    </div>

    <div class="form-row">
      <span class="form-label">Nama - Notel Kontak Person</span>
      <span class="form-colon">:</span>
      <div class="form-value"><span class="form-text ${val(mergedData.contactPerson) ? '' : 'form-text-empty'}">${val(mergedData.contactPerson) || '.'}</span></div>
    </div>

    <div class="form-row">
      <span class="form-label">Tanggal Instalasi</span>
      <span class="form-colon">:</span>
      <div class="form-value"><span class="form-text">${day} ${month} ${year}</span></div>
    </div>

    <div class="section" style="margin-top:12px">
      <div class="section-title">DATEK :</div>
      <table>
        <thead>
          <tr>
            <th>DETAIL</th><th>AREA</th><th>ODC</th><th>ODP</th><th>PORT</th><th>DC</th><th>SOC</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="height:24px">&nbsp;</td>
            <td>${val(mergedData.area)}</td>
            <td>${val(mergedData.odc)}</td>
            <td>${val(mergedData.odp)}</td>
            <td>${val(mergedData.port)}</td>
            <td>${val(mergedData.dc)}</td>
            <td>${val(mergedData.soc)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">DEVICE :</div>
      <div class="form-row">
        <span class="form-label">Type ONT</span><span class="form-colon">:</span>
        <div class="form-value"><span class="form-text ${val(mergedData.ontType) ? '' : 'form-text-empty'}">${val(mergedData.ontType) || '.'}</span></div>
      </div>
      <div class="form-row">
        <span class="form-label">SN ONT</span><span class="form-colon">:</span>
        <div class="form-value"><span class="form-text ${val(mergedData.ontSerial) ? '' : 'form-text-empty'}">${val(mergedData.ontSerial) || '.'}</span></div>
      </div>
      <div class="form-row">
        <span class="form-label">STB ID</span><span class="form-colon">:</span>
        <div class="form-value"><span class="form-text ${val(mergedData.stbId) ? '' : 'form-text-empty'}">${val(mergedData.stbId) || '.'}</span></div>
      </div>
      <div class="form-row">
        <span class="form-label">Type Router</span><span class="form-colon">:</span>
        <div class="form-value"><span class="form-text ${val(mergedData.routerType) ? '' : 'form-text-empty'}">${val(mergedData.routerType) || '.'}</span></div>
      </div>
      <div class="form-row">
        <span class="form-label">SN Router</span><span class="form-colon">:</span>
        <div class="form-value"><span class="form-text ${val(mergedData.routerSerial) ? '' : 'form-text-empty'}">${val(mergedData.routerSerial) || '.'}</span></div>
      </div>
    </div>

    <div class="disclaimer">
      <div class="disclaimer-title">DISCLAIMER :</div>
      <ol>
        <li>Perangkat (ONT/Router/STB) yang dipasang di rumah pelanggan adalah milik Telnet Indonesia yang dipinjamkan selama menjadi pelanggan Telnet Indonesia.</li>
        <li>Telnet Indonesia dapat mengambil Perangkat bila tidak melakukan pembayaran selama 3 bulan berturut-turut.</li>
      </ol>
    </div>

    <div class="closing-text">
      Demikian Berita Acara ini dibuat untuk dapat dipergunakan seperlunya.
    </div>

    <div class="signature-section">
      <div class="signature-date">${cityDate}, ${day} ${month} ${year}</div>
      <div class="signature-box">
        <div class="signature-title">Pelanggan,</div>
        <div class="signature-space">
          ${mergedData.customerSignature ? `<img src="${mergedData.customerSignature}" class="signature-image" />` : ''}
        </div>
        <div class="signature-name">${val(mergedData.customerName)}</div>
      </div>
      <div class="signature-box">
        <div class="signature-title">Petugas Telnet Indonesia,</div>
        <div class="signature-space">
          ${mergedData.technicianSignature ? `<img src="${mergedData.technicianSignature}" class="signature-image" />` : ''}
        </div>
        <div class="signature-name">${val(mergedData.technician)}</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: { top: '12mm', right: '15mm', bottom: '15mm', left: '15mm' },
      printBackground: true,
    });

    await browser.close();
    browser = null;

    // Set response headers
    const filename = `Berita-Acara-${activation.serviceNumber}-${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating PDF:', error);
    if (browser) {
      try { await browser.close(); } catch (e) {}
    }
    res.status(500).json({ error: 'Failed to generate PDF', message: error.message });
  }
});

module.exports = router;
