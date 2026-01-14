import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { PSBActivation } from '@/types/psb';

export const generateInstallationReportPDF = async (
  activation: PSBActivation,
  technicianSignature: string,
  customerSignature: string
): Promise<void> => {
  const report = activation.installationReport;
  const date = new Date(activation.activationDate);
  const day = date.getDate();
  const month = date.toLocaleString('id-ID', { month: 'long' });
  const year = date.getFullYear();
  const cityDate = activation.cluster || '...';

  // Service type checkboxes
  const isPassangBaru = report?.serviceType === 'pasang_baru' ? 'checked' : '';
  const isCabut = report?.serviceType === 'cabut' ? 'checked' : '';
  const isUpgrade = report?.serviceType === 'upgrade' ? 'checked' : '';
  const isDowngrade = report?.serviceType === 'downgrade' ? 'checked' : '';
  const isPDA = report?.serviceType === 'pda' ? 'checked' : '';

  // Package speed checkboxes
  const speed20 = report?.packageSpeed === 20 ? 'checked' : '';
  const speed30 = report?.packageSpeed === 30 ? 'checked' : '';
  const speed40 = report?.packageSpeed === 40 ? 'checked' : '';
  const speed50 = report?.packageSpeed === 50 ? 'checked' : '';
  const speed100 = report?.packageSpeed === 100 ? 'checked' : '';

  const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Berita Acara Instalasi - TelNet Fiber</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: "Times New Roman", Times, serif;
            background: white;
            color: black;
            margin: 0;
            padding: 0;
        }

        @page {
            size: A4;
            margin: 15mm 15mm 20mm 15mm;
        }

        @media print {
            body {
                background: white;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            .container {
                box-shadow: none;
                margin: 0;
                padding: 0;
                width: 100%;
            }
        }

        .container {
            width: 210mm; 
            min-height: 297mm;
            background: white;
            margin: 0 auto;
            padding: 0mm 0mm;
        }

        .header {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 25px;
            text-align: center;
        }

        .logo {
            margin-top: 0;
            margin-bottom: 5px;
        }

        .logo-img {
            height: 90px;
            object-fit: contain;
        }

        .title {
            font-size: 18px;
            font-weight: bold;
            text-decoration: underline;
        }

        .section {
            margin-bottom: 15px;
        }

        .section-title {
            font-weight: bold;
            margin-bottom: 15px;
            font-size: 13px;
        }

        .checkbox-group {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px;
            margin-bottom: 15px;
            padding-left: 90px;
        }

        .checkbox-item {
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .checkbox-item input[type="checkbox"] {
            width: 14px;
            height: 14px;
        }

        .form-row {
            display: flex;
            gap: 10px;
            margin-bottom: 8px;
            align-items: center;
        }

        .form-label {
            min-width: 230px;
            font-size: 13px;
        }

        .form-input {
            flex: 1;
            border: none;
            border-bottom: 1px dotted #999;
            padding: 2px 5px;
            font-size: 13px;
        }

        .speed-option {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 12px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }

        table th,
        table td {
            border: 1px solid #000;
            padding: 5px;
            text-align: center;
            font-size: 12px;
        }

        table th {
            background: #f0f0f0;
            font-weight: bold;
        }

        .device-section {
            margin: 10px 0;
        }

        .disclaimer {
            margin-top: 10px;
            font-size: 12px;
            line-height: 1.5;
        }

        .disclaimer-title {
            font-weight: bold;
            margin-bottom: 6px;
        }

        .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
            padding-top: 10px;
            position: relative;
        }

        .signature-box {
            text-align: center;
            width: 45%;
        }

        .signature-image {
            height: 80px;
            margin: 10px 0;
        }

        .signature-line {
            margin-top: 60px;
            padding-top: 5px;
            font-weight: bold;
            font-size: 13px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                <img
                    src="/TitlePdfReport/TelnetFiber.png"
                    alt="TelNet Fiber"
                    class="logo-img"
                />
            </div>
            <div class="title">BERITA ACARA INSTALASI</div>
        </div>

        <div class="section">
            <div class="section-title">LAYANAN :</div>
            <div class="checkbox-group">
                <div class="checkbox-item">
                    <input type="checkbox" id="telnet-fiber" checked>
                    <label for="telnet-fiber">TELNET FIBER</label>
                </div>
                <div class="checkbox-item">
                    <input type="checkbox" id="telnet-dedicated">
                    <label for="telnet-dedicated">TELNET DEDICATED</label>
                </div>
                <div class="checkbox-item">
                    <input type="checkbox" id="vpn-ip">
                    <label for="vpn-ip">VPN IP</label>
                </div>
                <div class="checkbox-item">
                    <input type="checkbox" id="gpon" checked>
                    <label for="gpon">GPON</label>
                </div>
                <div class="checkbox-item">
                    <input type="checkbox" id="iptv">
                    <label for="iptv">IPTV</label>
                </div>
                <div class="checkbox-item">
                    <input type="checkbox" id="epon">
                    <label for="epon">EPON</label>
                </div>
            </div>
        </div>

        <div style="margin: 20px 0; line-height: 1.6; font-size: 13px">
            Pada hari ini, tanggal<input
                type="text"
                value="${day}"
                style="width: 80px; border: none; border-bottom: 1px dotted #999; margin: 0 5px"
            >, bulan<input
                type="text"
                value="${month}"
                style="width: 80px; border: none; border-bottom: 1px dotted #999; margin: 0 5px"
            >, tahun<input
                type="text"
                value="${year}"
                style="width: 80px; border: none; border-bottom: 1px dotted #999; margin: 0 5px"
            >. Telah dilakukan instalasi sesuai layanan diatas, dengan data dan hasil berikut :
        </div>

        <div class="form-row">
            <span class="form-label">Jenis Layanan</span>
            <span>:</span>
            <div style="display: flex; gap: 10px; flex-wrap: wrap">
                <div class="speed-option">
                    <input type="checkbox" id="pasang-baru" ${isPassangBaru}>
                    <label for="pasang-baru">Pasang Baru</label>
                </div>
                <div class="speed-option">
                    <input type="checkbox" id="cabut" ${isCabut}>
                    <label for="cabut">Cabut</label>
                </div>
                <div class="speed-option">
                    <input type="checkbox" id="upgrade" ${isUpgrade}>
                    <label for="upgrade">Upgrade</label>
                </div>
                <div class="speed-option">
                    <input type="checkbox" id="downgrade" ${isDowngrade}>
                    <label for="downgrade">Downgrade</label>
                </div>
                <div class="speed-option">
                    <input type="checkbox" id="pda" ${isPDA}>
                    <label for="pda">PDA</label>
                </div>
            </div>
        </div>

        <div class="form-row">
            <span class="form-label">Paket Layanan</span>
            <span>:</span>
            <div style="display: flex; gap: 10px; flex-wrap: wrap">
                <div class="speed-option">
                    <input type="checkbox" id="speed-20" ${speed20}>
                    <label for="speed-20">20 Mbps</label>
                </div>
                <div class="speed-option">
                    <input type="checkbox" id="speed-30" ${speed30}>
                    <label for="speed-30">30 Mbps</label>
                </div>
                <div class="speed-option">
                    <input type="checkbox" id="speed-40" ${speed40}>
                    <label for="speed-40">40 Mbps</label>
                </div>
                <div class="speed-option">
                    <input type="checkbox" id="speed-50" ${speed50}>
                    <label for="speed-50">50 Mbps</label>
                </div>
                <div class="speed-option">
                    <input type="checkbox" id="speed-100" ${speed100}>
                    <label for="speed-100">100 Mbps</label>
                </div>
            </div>
        </div>

        <div class="form-row">
            <span class="form-label">BW (Mbps) Speed Test Download</span>
            <span>:</span>
            <input
                type="text"
                class="form-input"
                style="max-width: 120px"
                value="${report?.speedTest?.download || ''}"
                placeholder="……………."
            >
            <span>Mbps</span>
        </div>

        <div class="form-row">
            <span class="form-label">BW (Mbps) Speed Test Upload</span>
            <span>:</span>
            <input
                type="text"
                class="form-input"
                style="max-width: 120px"
                value="${report?.speedTest?.upload || ''}"
                placeholder="……………."
            >
            <span>Mbps</span>
        </div>

        <div class="form-row">
            <span class="form-label">Nama Pelanggan</span>
            <span>:</span>
            <input
                type="text"
                class="form-input"
                value="${activation.customerName}"
                placeholder="………………………………………………………………………........."
            >
        </div>

        <div class="form-row">
            <span class="form-label">Alamat (Dipasang / Alamat Baru)</span>
            <span>:</span>
            <input
                type="text"
                class="form-input"
                value="${activation.cluster}"
                placeholder="………………………………………………………………………........."
            >
        </div>

        <div class="form-row">
            <span class="form-label">Nomor FASTEL</span>
            <span>:</span>
            <input
                type="text"
                class="form-input"
                value="${report?.fastelNumber || ''}"
                placeholder="………………………………………………………………………........."
            >
        </div>

        <div class="form-row">
            <span class="form-label">Nama - Notel Kontak Person</span>
            <span>:</span>
            <input
                type="text"
                class="form-input"
                value="${report?.contactPerson || ''}"
                placeholder="………………………………………………………………………........."
            >
        </div>

        <div class="form-row">
            <span class="form-label">Tanggal Instalasi</span>
            <span>:</span>
            <input
                type="text"
                class="form-input"
                value="${day} ${month} ${year}"
                placeholder="………………………………………………………………………........."
            >
        </div>

        <div class="section" style="margin-top: 20px">
            <div class="section-title">DATEK :</div>
            <table>
                <thead>
                    <tr>
                        <th>DETAIL</th>
                        <th>AREA</th>
                        <th>ODC</th>
                        <th>ODP</th>
                        <th>PORT</th>
                        <th>DC</th>
                        <th>SOC</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="height: 30px">&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                        <td>&nbsp;</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="device-section">
            <div class="section-title">DEVICE :</div>
            <div class="form-row">
                <span class="form-label">Type ONT</span>
                <span>:</span>
                <input
                    type="text"
                    class="form-input"
                    value="${report?.device?.ontType || ''}"
                    placeholder="………………………………………………………………………........."
                >
            </div>
            <div class="form-row">
                <span class="form-label">SN ONT</span>
                <span>:</span>
                <input
                    type="text"
                    class="form-input"
                    value="${report?.device?.ontSerial || activation.serviceNumber}"
                    placeholder="………………………………………………………………………........."
                >
            </div>
            <div class="form-row">
                <span class="form-label">STB ID</span>
                <span>:</span>
                <input
                    type="text"
                    class="form-input"
                    value="${report?.device?.stbId || ''}"
                    placeholder="………………………………………………………………………........."
                >
            </div>
            <div class="form-row">
                <span class="form-label">Type Router</span>
                <span>:</span>
                <input
                    type="text"
                    class="form-input"
                    value="${report?.device?.routerType || ''}"
                    placeholder="………………………………………………………………………........."
                >
            </div>
            <div class="form-row">
                <span class="form-label">SN Router</span>
                <span>:</span>
                <input
                    type="text"
                    class="form-input"
                    value="${report?.device?.routerSerial || ''}"
                    placeholder="………………………………………………………………………........."
                >
            </div>
        </div>

        <div class="disclaimer">
            <div class="disclaimer-title">DISCLAIMER :</div>
            <ol>
                <li>
                    Perangkat (ONT/Router/STB) yang dipasang di rumah pelanggan adalah milik Telnet Indonesia 
                    yang dipinjamkan selama menjadi pelanggan Telnet Indonesia.
                </li>
                <li>
                    Telnet Indonesia dapat mengambil Perangkat bila tidak melakukan pembayaran selama 3 bulan berturut-turut.
                </li>
            </ol>
        </div>

        <div style="margin-top: 30px; line-height: 1.6; font-size: 13px">
            Demikian Berita Acara ini dibuat untuk dapat dipergunakan seperlunya.
        </div>

        <div class="signature-section">
            <div style="position: absolute; right: 65px; bottom: 130px; font-size: 13px">
                ${cityDate}, ${day} ${month} ${year}
            </div>
            <div class="signature-box">
                <div style="font-size: 13px">Pelanggan,</div>
                ${customerSignature ? `<img src="${customerSignature}" class="signature-image" alt="Customer Signature" />` : '<div style="height: 80px;"></div>'}
                <div class="signature-line">${activation.customerName}</div>
            </div>
            <div class="signature-box">
                <div style="font-size: 13px">Petugas Telnet Indonesia,</div>
                ${technicianSignature ? `<img src="${technicianSignature}" class="signature-image" alt="Technician Signature" />` : '<div style="height: 80px;"></div>'}
                <div class="signature-line">${activation.technician}</div>
            </div>
        </div>
    </div>
</body>
</html>
  `;

  // Create a temporary container
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'absolute';
  tempContainer.style.left = '-9999px';
  tempContainer.innerHTML = htmlContent;
  document.body.appendChild(tempContainer);

  try {
    // Convert HTML to canvas
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    // Create PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    
    // Download PDF
    const fileName = `Berita-Acara-${activation.serviceNumber}-${date.toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  } finally {
    // Clean up
    document.body.removeChild(tempContainer);
  }
};

// Export alias for compatibility
export const generatePSBActivationReport = async (activation: PSBActivation): Promise<void> => {
  const technicianSignature = activation.installationReport?.signatures?.technician || '';
  const customerSignature = activation.installationReport?.signatures?.customer || '';
  
  if (!technicianSignature || !customerSignature) {
    throw new Error('Tanda tangan belum lengkap');
  }
  
  return generateInstallationReportPDF(activation, technicianSignature, customerSignature);
};
