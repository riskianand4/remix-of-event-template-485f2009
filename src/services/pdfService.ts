import { PSBOrder } from "@/types/psb";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface InstallationReport {
  psbOrder: PSBOrder;
  technician: {
    name: string;
    employeeId: string;
    certification?: string;
  };
  installation: {
    date: string;
    startTime: string;
    endTime: string;
    ontSerialNumber?: string;
    cableLength?: number;
    installationType: "aerial" | "underground" | "indoor";
    signalStrength?: number;
  };
  service: {
    type: string[];
    package: string;
    serviceType?: string;
    fastelNumber?: string;
    speedTest: {
      download?: number;
      upload?: number;
      ping?: number;
    };
  };
  device: {
    ontType?: string;
    serialNumber?: string;
    routerType?: string;
    routerSerial?: string;
    stbId?: string;
  };
  datek?: {
    area?: string;
    odc?: string;
    odp?: string;
    port?: string;
    dc?: string;
    soc?: string;
  };
  fastelNumber?: string;
  signatures: {
    technician?: string;
    customer?: string;
  };
  notes?: string;
}

export class PDFService {
  static async generateInstallationReport(
    reportData: InstallationReport
  ): Promise<Blob> {
    try {
      const htmlTemplate = this.createInstallationReportHTML(reportData);

      // Create a temporary div to render the HTML
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlTemplate;
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.top = "0";
      tempDiv.style.width = "794px";
      tempDiv.style.background = "white";

      document.body.appendChild(tempDiv);

      // Wait for content to render and images to load
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Convert to canvas with higher quality
      const canvas = await html2canvas(tempDiv, {
        scale: 3, // Increased for better quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: 794,
        height: tempDiv.scrollHeight,
        logging: false,
      });

      // Remove temporary div
      document.body.removeChild(tempDiv);

      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgData = canvas.toDataURL("image/png", 1.0); // Use PNG for better quality
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

      // Return as Blob
      return new Promise((resolve) => {
        const pdfBlob = pdf.output("blob");
        resolve(pdfBlob);
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw new Error("Gagal membuat PDF. Silakan coba lagi.");
    }
  }

  private static createInstallationReportHTML(
    data: InstallationReport
  ): string {
    const {
      psbOrder,
      technician,
      installation,
      service,
      device,
      datek,
      fastelNumber,
      signatures,
      notes,
    } = data;
    const installDate = new Date(installation.date);
    const day = installDate.getDate().toString();
    const month = installDate.toLocaleDateString("id-ID", { month: "long" });
    const year = installDate.getFullYear().toString();

    // Service type checks
    const isTelnetFiber = service.type.includes("TELNET_FIBER")
      ? "checked"
      : "";
    const isTelnetDedicated = service.type.includes("TELNET_DEDICATED")
      ? "checked"
      : "";
    const isVpnIp = service.type.includes("VPN_IP") ? "checked" : "";
    const isGpon = service.type.includes("GPON") ? "checked" : "";
    const isIptv = service.type.includes("IPTV") ? "checked" : "";
    const isEpon = service.type.includes("EPON") ? "checked" : "";

    // Service type
    const isPassangBaru =
      service.serviceType === "pasang_baru" ? "checked" : "";
    const isCabut = service.serviceType === "cabut" ? "checked" : "";
    const isUpgrade = service.serviceType === "upgrade" ? "checked" : "";
    const isDowngrade = service.serviceType === "downgrade" ? "checked" : "";
    const isPda = service.serviceType === "pda" ? "checked" : "";

    // Package speed checks
    const is20Mbps = service.package?.includes("20") ? "checked" : "";
    const is30Mbps = service.package?.includes("30") ? "checked" : "";
    const is40Mbps = service.package?.includes("40") ? "checked" : "";
    const is50Mbps = service.package?.includes("50") ? "checked" : "";
    const is100Mbps = service.package?.includes("100") ? "checked" : "";

    return `
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
                color: #000;
                margin: 0;
                padding: 0;
                -webkit-font-smoothing: antialiased;
                text-rendering: optimizeLegibility;
            }

            .container {
                width: 794px;
                margin: 0 auto;
                padding: 40px 50px 30px 50px;
                background: white;
            }

            .header {
                text-align: center;
                margin-bottom: 15px;
            }

            .logo-img {
                height: 120px;
                width: auto;
                display: block;
                margin: 0 auto 0px auto;
            }

            .title {
                font-size: 16px;
                font-weight: bold;
                text-decoration: underline;
                margin-top: 0px;
                letter-spacing: 0.5px;
            }

            .section {
                margin-bottom: 5px;
            }

            .section-title {
                font-weight: bold;
                margin-bottom: 4px;
                font-size: 13px;
            }

            .checkbox-group {
                display: grid;
                grid-template-columns: 240px 240px;
                column-gap: 80px;
                row-gap: 6px;
                margin-bottom: 8px;
                padding-left: 90px;
            }

            .checkbox-item {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 12px;
                line-height: 1.4;
            }

            .checkbox-item input[type="checkbox"] {
                width: 14px;
                height: 14px;
                margin: 0;
                flex-shrink: 0;
            }

            .checkbox-item label {
                white-space: nowrap;
            }

            .date-text {
                margin: 12px 0;
                line-height: 1.6;
                font-size: 13px;
            }

            .date-input {
                display: inline-block;
                min-width: 60px;
                border: none;
                margin: 0 4px;
                padding: 0 4px;
                font-family: inherit;
                font-size: inherit;
                text-align: center;
                background: transparent;
            }

            .form-row {
                display: flex;
                align-items: baseline;
                margin-bottom: 2px;
                min-height: 24px;
            }

            .form-label {
                width: 235px;
                font-size: 12px;
                flex-shrink: 0;
                line-height: 1.3;
            }

            .form-colon {
                width: 20px;
                text-align: center;
                flex-shrink: 0;
                line-height: 1.3;
            }

            .form-value {
                flex: 1;
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .form-input {
                flex: 1;
                border: none;
                border-bottom: 1px solid #000;
                padding: 2px 6px;
                font-size: 13px;
                font-family: "Times New Roman", Times, serif;
                background: white;
                min-height: 22px;
                color: #000;
                font-weight: normal;
                line-height: 1.4;
            }
            
            .form-text {
                flex: 1;
                padding: 0 6px 2px 6px;
                font-size: 13px;
                font-family: "Times New Roman", Times, serif;
                min-height: 20px;
                color: #000;
                line-height: 1.3;
                display: flex;
                align-items: baseline;
            }

            .speed-option {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 11px;
                white-space: nowrap;
            }

            .speed-option input[type="checkbox"] {
                width: 13px;
                height: 13px;
                margin: 0;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                margin: 10px 0;
            }

            table th,
            table td {
                border: 1px solid #000;
                padding: 6px 4px;
                text-align: center;
                font-size: 11px;
                font-weight: normal;
            }

            table th {
                background: #e8e8e8;
                font-weight: bold;
            }

            .device-section {
                margin: 5px 0;
            }

            .disclaimer {
                margin-top: 12px;
                font-size: 11px;
                line-height: 1.5;
            }

            .disclaimer-title {
                font-weight: bold;
                margin-bottom: 6px;
            }

            .disclaimer ol {
                padding-left: 22px;           /* jarak angka ke teks */
                list-style-type: decimal;
                list-style-position: outside;  /* angka di luar teks */
                margin: 0;
            }

            .disclaimer li {
                display: list-item;
                font-weight: bold;
                font-size: 12px;
                line-height: 1.4;
                margin-bottom: 6px;
                color: #000;

                position: relative;
                padding-left: 3px;    
                vertical-align: middle;
            }
            .disclaimer li::marker {
                position: relative;
                top: 2px;       
                font-weight: bold;
            }

            .disclaimer ol li {
                margin-bottom: 4px;
            }

            .closing-text {
                margin-top: 15px;
                line-height: 1.5;
                font-size: 12px;
            }

            .signature-section {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-top: 25px;
                position: relative;
            }

            .signature-date {
                position: absolute;
                right: 83px;
                top: -20px;
                font-size: 12px;
            }

            .signature-box {
                width: 45%;
                text-align: center;
            }

            .signature-title {
                font-size: 12px;
                margin-bottom: 5px;
            }

            .signature-space {
                height: 70px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .signature-image {
                max-width: 150px;
                max-height: 60px;
                object-fit: contain;
            }

            .signature-line {
                margin-top: 5px;
                font-size: 12px;
                display: inline-block;
                min-width: 180px;
                padding-top: 3px;
                font-weight: bold;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img
                    src="/TitlePdfReport/TelnetFiber.png"
                    alt="TelNet Fiber"
                    class="logo-img"
                    crossorigin="anonymous"
                />
                <div class="title">BERITA ACARA INSTALASI</div>
            </div>

            <div class="section">
                <div class="section-title">LAYANAN :</div>
                <div class="checkbox-group">
                    <div class="checkbox-item">
                        <input type="checkbox" ${isTelnetFiber}>
                        <label>TELNET HOME</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" ${isTelnetDedicated}>
                        <label>TELNET DEDICATED</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" ${isVpnIp}>
                        <label>VPN IP</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" ${isGpon}>
                        <label>GPON</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" ${isIptv}>
                        <label>IPTV</label>
                    </div>
                    <div class="checkbox-item">
                        <input type="checkbox" ${isEpon}>
                        <label>EPON</label>
                    </div>
                </div>
            </div>

            <div class="date-text">
                Pada hari ini, tanggal<span class="date-input">${day}</span>, bulan<span class="date-input">${month}</span>, tahun<span class="date-input">${year}</span>. Telah dilakukan instalasi sesuai layanan diatas, dengan data dan hasil berikut :
            </div>

            <div class="form-row">
                <div class="form-label">Jenis Layanan</div>
                <div class="form-colon">:</div>
                <div class="form-value">
                    <div class="speed-option ">
                        <input type="checkbox" ${isPassangBaru}>
                        <label>Pasang Baru</label>
                    </div>
                    <div class="speed-option">
                        <input type="checkbox" ${isCabut}>
                        <label>Cabut</label>
                    </div>
                    <div class="speed-option">
                        <input type="checkbox" ${isUpgrade}>
                        <label>Upgrade</label>
                    </div>
                    <div class="speed-option">
                        <input type="checkbox" ${isDowngrade}>
                        <label>Downgrade</label>
                    </div>
                    <div class="speed-option">
                        <input type="checkbox" ${isPda}>
                        <label>PDA</label>
                    </div>
                </div>
            </div>

            <div class="form-row">
                <div class="form-label">Paket Layanan</div>
                <div class="form-colon">:</div>
                <div class="form-value">
                    <div class="speed-option">
                        <input type="checkbox" ${is20Mbps}>
                        <label>20 Mbps</label>
                    </div>
                    <div class="speed-option">
                        <input type="checkbox" ${is30Mbps}>
                        <label>30 Mbps</label>
                    </div>
                    <div class="speed-option">
                        <input type="checkbox" ${is40Mbps}>
                        <label>40 Mbps</label>
                    </div>
                    <div class="speed-option">
                        <input type="checkbox" ${is50Mbps}>
                        <label>50 Mbps</label>
                    </div>
                    <div class="speed-option">
                        <input type="checkbox" ${is100Mbps}>
                        <label>100 Mbps</label>
                    </div>
                </div>
            </div>

            <div class="form-row">
                <div class="form-label">BW (Mbps) Speed Test Download</div>
                <div class="form-colon">:</div>
                <div class="form-value">
                    <div class="form-text" style="max-width: 100px;">${service.speedTest.download || ""}</div>
                    <span style="font-size: 11px;">Mbps</span>
                </div>
            </div>

            <div class="form-row">
                <div class="form-label">BW (Mbps) Speed Test Upload</div>
                <div class="form-colon">:</div>
                <div class="form-value">
                    <div class="form-text" style="max-width: 100px;">${service.speedTest.upload || ""}</div>
                    <span style="font-size: 11px;">Mbps</span>
                </div>
            </div>

            <div class="form-row">
                <div class="form-label">Nama Pelanggan</div>
                <div class="form-colon">:</div>
                <div class="form-value">
                    <div class="form-text">${psbOrder.customerName}</div>
                </div>
            </div>

            <div class="form-row">
                <div class="form-label">Alamat (Dipasang / Alamat Baru)</div>
                <div class="form-colon">:</div>
                <div class="form-value">
                    <div class="form-text">${psbOrder.address}</div>
                </div>
            </div>

            <div class="form-row">
                <div class="form-label">Nomor FASTEL</div>
                <div class="form-colon">:</div>
                <div class="form-value">
                    <div class="form-text">${service.fastelNumber || fastelNumber || ""}</div>
                </div>
            </div>

            <div class="form-row">
                <div class="form-label">Nama - Notel Kontak Person</div>
                <div class="form-colon">:</div>
                <div class="form-value">
                    <div class="form-text">${psbOrder.customerPhone || ""}</div>
                </div>
            </div>

            <div class="form-row">
                <div class="form-label">Tanggal Instalasi</div>
                <div class="form-colon">:</div>
                <div class="form-value">
                    <div class="form-text">${installDate.toLocaleDateString("id-ID")}</div>
                </div>
            </div>

            <div class="section" style="margin-top: 12px;">
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
                            <td style="height: 28px;">${datek?.area || ""}</td>
                            <td>${datek?.area || ""}</td>
                            <td>${datek?.odc || ""}</td>
                            <td>${datek?.odp || ""}</td>
                            <td>${datek?.port || ""}</td>
                            <td>${datek?.dc || ""}</td>
                            <td>${datek?.soc || ""}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="device-section">
                <div class="section-title">DEVICE :</div>
                <div class="form-row">
                    <div class="form-label">Type ONT</div>
                    <div class="form-colon">:</div>
                    <div class="form-value">
                        <div class="form-text">${device.ontType || ""}</div>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-label">SN ONT</div>
                    <div class="form-colon">:</div>
                    <div class="form-value">
                        <div class="form-text">${device.serialNumber || installation.ontSerialNumber || ""}</div>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-label">STB ID</div>
                    <div class="form-colon">:</div>
                    <div class="form-value">
                        <div class="form-text">${device.stbId || ""}</div>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-label">Type Router</div>
                    <div class="form-colon">:</div>
                    <div class="form-value">
                        <div class="form-text">${device.routerType || ""}</div>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-label">SN Router</div>
                    <div class="form-colon">:</div>
                    <div class="form-value">
                        <div class="form-text">${device.routerSerial || ""}</div>
                    </div>
                </div>
            </div>

            <div class="disclaimer">
                <div class="disclaimer-title">DISCLAIMER :</div>
                <ol>
                    <li>Perangkat (ONT/Router/STB) yang dipasang di rumah pelanggan adalah milik Telnet Indonesia yang dipinjamkan selama menjadi pelanggan Telnet Indonesia.</li>
                    <li>Telnet Indonesia dapat mengambil Perangkat bila tidak melakukan pembayaran selama 3 bulan berturut - turut.</li>
                </ol>
            </div>

            <div class="closing-text">
                Demikian Berita Acara ini dibuat untuk dapat dipergunakan seperlunya.
            </div>

            <div class="signature-section">
                <div class="signature-date">${psbOrder.address || "Lokasi"}, ${day} ${month} ${year}</div>
                <div class="signature-box">
                    <div class="signature-title">Pelanggan,</div>
                    <div class="signature-space">
                        ${signatures.customer ? `<img src="${signatures.customer}" class="signature-image" alt="Customer Signature" />` : ''}
                    </div>
                    <div class="signature-line">${psbOrder.customerName}</div>
                </div>
                <div class="signature-box">
                    <div class="signature-title">Petugas Telnet Indonesia,</div>
                    <div class="signature-space">
                        ${signatures.technician ? `<img src="${signatures.technician}" class="signature-image" alt="Technician Signature" />` : ''}
                    </div>
                    <div class="signature-line">${technician.name}</div>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  static downloadPDF(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export default PDFService;