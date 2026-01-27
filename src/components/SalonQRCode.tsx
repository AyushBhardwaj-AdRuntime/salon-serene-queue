import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Download, Printer } from "lucide-react";

interface SalonQRCodeProps {
  salonId: string;
  salonName: string;
}

export function SalonQRCode({ salonId, salonName }: SalonQRCodeProps) {
  const baseUrl = window.location.origin;
  const checkinUrl = `${baseUrl}/checkin/${salonId}`;

  const handleDownload = () => {
    const svg = document.getElementById("salon-qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `${salonName.replace(/\s+/g, "-")}-qr-code.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${salonName}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: system-ui, sans-serif;
            }
            h1 { margin-bottom: 1rem; font-size: 1.5rem; }
            p { margin-top: 1rem; color: #666; font-size: 1rem; }
          </style>
        </head>
        <body>
          <h1>${salonName}</h1>
          <div>${document.getElementById("salon-qr-code")?.outerHTML}</div>
          <p>Scan to join the queue</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-serif flex items-center gap-2">
          <QrCode className="w-5 h-5 text-primary" />
          Customer Self Check-in
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-4 rounded-lg">
            <QRCodeSVG
              id="salon-qr-code"
              value={checkinUrl}
              size={180}
              level="H"
              includeMargin
            />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Display this QR code for customers to scan and join the queue
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
