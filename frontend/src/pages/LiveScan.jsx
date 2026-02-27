import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function LiveScan() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [result, setResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    if (!isScanning) return;
    const interval = setInterval(captureFrame, 2500);
    return () => clearInterval(interval);
  }, [isScanning]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      videoRef.current.srcObject = stream;
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    stream?.getTracks().forEach(track => track.stop());
  };

  const captureFrame = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || video.readyState !== 4) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append("image", blob, "frame.jpg");

      try {
        const res = await axios.post("http://localhost:5001/predict", formData);
        setResult(res.data);
      } catch (err) {
        console.error("Prediction error:", err);
      }
    }, "image/jpeg", 0.8);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-green-800">
          📱 Live Camera Scan
        </h1>

        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-6">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-xl border-4 border-green-500"
          />

          <canvas ref={canvasRef} style={{ display: "none" }} />

          <button
            onClick={() => setIsScanning(!isScanning)}
            className={`w-full mt-4 py-3 rounded-xl font-bold text-white ${
              isScanning ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
            }`}
          >
            {isScanning ? "⏸️ Stop Scanning" : "▶️ Start Scanning"}
          </button>

          {result && (
            <div className="mt-6 p-4 bg-gradient-to-r from-green-100 to-blue-100 rounded-xl">
              <h2 className="text-2xl font-bold text-green-800">
                🦠 {result.disease}
              </h2>
              <p className="text-lg mt-2">
                <span className="font-semibold">Confidence:</span>{" "}
                {(result.confidence * 100).toFixed(2)}%
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Model: {result.model}
              </p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
