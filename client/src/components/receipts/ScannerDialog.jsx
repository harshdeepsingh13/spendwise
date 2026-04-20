import CameraAltIcon from "@mui/icons-material/CameraAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FlipCameraIosIcon from "@mui/icons-material/FlipCameraIos";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { Box, Button, CircularProgress, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, TextField, Typography, useTheme } from "@mui/material";
import dayjs from "@/lib/dayjs";
import jscanify from "jscanify/client";
import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { useCvReady } from "../../hooks/useCvReady";
import { useCategories } from "../../hooks/useCategories";
import { useExpenseMutations } from "../../hooks/useExpenseMutations";
import { useOcrStatus, useReceiptUpload, useUpdateReceipt } from "../../hooks/useReceipt";
import { AppModal } from "../common/AppModal";
import { CustomDatePicker } from "../common/CustomDatePicker";
import { ReceiptDetailsForm } from "./ReceiptDetailsForm";

// ─── OCR + Save Step ────────────────────────────────────────────────────────

// source: { file: File, previewUrl: string | null, fileType: 'image' | 'pdf' }
const OcrStep = ({ source, existingTags, onSaved, onRetake }) => {
  const [receiptId, setReceiptId] = useState(null);
  const [amount, setAmount] = useState("");
  const [name, setName] = useState(source.file.name.replace(/\.[^/.]+$/, ""));
  const [tags, setTags] = useState([]);
  const uploadedRef = useRef(false);

  const { mutateAsync: upload, isPending: isUploading, isSuccess: uploadSuccess } = useReceiptUpload();
  const { mutateAsync: updateReceipt, isPending: isSaving } = useUpdateReceipt();
  const { data: ocrData, isError: ocrError } = useOcrStatus(receiptId);

  useEffect(() => {
    if (uploadedRef.current) return;
    uploadedRef.current = true;
    upload(source.file).then((data) => setReceiptId(data.id));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (ocrData?.ocrStatus === "done" && ocrData.ocrExtractedAmount) {
      setAmount(ocrData.ocrExtractedAmount);
    }
  }, [ocrData?.ocrStatus, ocrData?.ocrExtractedAmount]);

  const ocrDone = ocrError || ocrData?.ocrStatus === "done" || ocrData?.ocrStatus === "failed";
  const ocrRunning = receiptId && !ocrDone;

  const handleSave = async () => {
    if (!receiptId) return;
    await updateReceipt({ id: receiptId, amount: amount || undefined, name: name || undefined, tags, submitted: true });
    onSaved({ id: receiptId, amount });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {source.fileType === "pdf" ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            p: 2,
            borderRadius: 1,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <PictureAsPdfIcon sx={{ color: "error.light", fontSize: 36 }} />
          <Box>
            <Typography variant="body2" fontWeight={600} noWrap>
              {source.file.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {(source.file.size / 1024).toFixed(1)} KB · PDF · Page 1 will be scanned
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box
          component="img"
          src={source.previewUrl}
          alt="Cropped receipt"
          sx={{ width: "100%", maxHeight: 260, objectFit: "contain", borderRadius: 1 }}
        />
      )}

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minHeight: 28 }}>
        {isUploading && (
          <>
            <CircularProgress size={14} sx={{ color: "custom.aiPurple" }} />
            <Typography variant="caption" color="text.secondary">
              Uploading…
            </Typography>
          </>
        )}
        {ocrRunning && (
          <>
            <CircularProgress size={14} sx={{ color: "custom.aiPurple" }} />
            <Typography variant="caption" sx={{ color: "custom.aiPurple" }}>
              AI reading your receipt…
            </Typography>
          </>
        )}
        {ocrData?.ocrStatus === "done" && (
          <>
            <CheckCircleIcon fontSize="small" color="success" />
            <Typography variant="caption" color="success.main">
              Amount detected
            </Typography>
          </>
        )}
        {ocrData?.ocrStatus === "failed" && (
          <Typography variant="caption" color="error.main">
            Could not detect amount — enter manually
          </Typography>
        )}
      </Box>

      <ReceiptDetailsForm
        name={name}
        onNameChange={setName}
        amount={amount}
        onAmountChange={setAmount}
        tags={tags}
        onTagsChange={setTags}
        existingTags={existingTags}
      />

      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
        <Button onClick={onRetake} disabled={isSaving}>
          Retake
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={!receiptId || isSaving}>
          {isSaving ? "Saving…" : "Save Receipt"}
        </Button>
      </Box>
    </Box>
  );
};

// ─── Expense Step ────────────────────────────────────────────────────────────

const ExpenseStep = ({ receiptId, prefilledAmount, onDone, onSkip }) => {
  const [values, setValues] = useState({ amount: prefilledAmount ?? "", categoryId: "", date: dayjs(), notes: "" });
  const { data: categories = [] } = useCategories();
  const { create } = useExpenseMutations();

  const set = (field) => (e) => setValues((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    if (!values.amount || !values.categoryId || !values.date) return;
    await create.mutateAsync({
      amount: values.amount,
      category: values.categoryId,
      date: values.date.toISOString(),
      notes: values.notes || undefined,
      receipt: receiptId,
    });
    onDone();
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="body2" color="text.secondary">
        Log this as an expense? The receipt will be linked automatically.
      </Typography>

      <TextField
        label="Amount"
        type="number"
        inputProps={{ min: 0, step: "0.01" }}
        value={values.amount}
        onChange={set("amount")}
        fullWidth
        required
        autoFocus
      />

      <FormControl fullWidth required>
        <InputLabel>Category</InputLabel>
        <Select value={values.categoryId} onChange={set("categoryId")} label="Category">
          {categories.map((cat) => (
            <MenuItem key={cat._id} value={cat._id}>
              <Stack direction="row" alignItems="center" gap={1}>
                {cat.color && (
                  <Box component="span" sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: cat.color, display: "inline-block", flexShrink: 0 }} />
                )}
                {cat.name}
              </Stack>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <CustomDatePicker
        label="Date"
        value={values.date}
        onChange={(date) => setValues((prev) => ({ ...prev, date }))}
        margin="dense"
      />

      <TextField
        label="Notes"
        value={values.notes}
        onChange={set("notes")}
        fullWidth
        multiline
        minRows={2}
        placeholder="Optional"
      />

      <Stack direction="row" justifyContent="space-between">
        <Button onClick={onSkip} color="inherit">
          Skip
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={create.isPending || !values.amount || !values.categoryId}
        >
          {create.isPending ? <CircularProgress size={16} /> : "Log Expense"}
        </Button>
      </Stack>
    </Box>
  );
};

// ─── Camera Step ─────────────────────────────────────────────────────────────

const drawQuad = (ctx, corners, color) => {
  const { topLeftCorner, topRightCorner, bottomLeftCorner, bottomRightCorner } = corners;
  if (!topLeftCorner || !topRightCorner || !bottomLeftCorner || !bottomRightCorner) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(topLeftCorner.x, topLeftCorner.y);
  ctx.lineTo(topRightCorner.x, topRightCorner.y);
  ctx.lineTo(bottomRightCorner.x, bottomRightCorner.y);
  ctx.lineTo(bottomLeftCorner.x, bottomLeftCorner.y);
  ctx.closePath();
  ctx.stroke();
};

const CameraStep = ({ onCaptured }) => {
  const theme = useTheme();
  const cvReady = useCvReady();
  const webcamRef = useRef(null);
  const overlayRef = useRef(null);
  const animRef = useRef(null);
  const scannerRef = useRef(null);
  const tmpCanvasRef = useRef(null);
  const lastDetectRef = useRef(0);
  const [facingMode, setFacingMode] = useState("environment");
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    if (!cvReady) return;
    scannerRef.current = new jscanify();
    tmpCanvasRef.current = document.createElement("canvas");
  }, [cvReady]);

  const detect = useCallback(() => {
    animRef.current = requestAnimationFrame(detect);

    const now = Date.now();
    if (now - lastDetectRef.current < 100) return; // ~10fps throttle
    lastDetectRef.current = now;

    const video = webcamRef.current?.video;
    const overlay = overlayRef.current;
    const scanner = scannerRef.current;
    const tmp = tmpCanvasRef.current;

    if (!video || !overlay || !cvReady || !scanner || !window.cv || !tmp) return;

    const { videoWidth: w, videoHeight: h } = video;
    if (!w || !h) return;

    if (tmp.width !== w || tmp.height !== h) {
      tmp.width = w;
      tmp.height = h;
    }
    overlay.width = w;
    overlay.height = h;

    tmp.getContext("2d").drawImage(video, 0, 0, w, h);

    const ctx = overlay.getContext("2d");
    ctx.clearRect(0, 0, w, h);

    let src;
    try {
      src = window.cv.imread(tmp);
      const contour = scanner.findPaperContour(src);
      if (contour) {
        const corners = scanner.getCornerPoints(contour);
        drawQuad(ctx, corners, theme.palette.custom.aiPurple);
      }
    } catch (_) {
      // ignore per-frame errors
    } finally {
      src?.delete();
    }
  }, [cvReady, theme]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(detect);
    return () => cancelAnimationFrame(animRef.current);
  }, [detect]);

  const handleCapture = async () => {
    const scanner = scannerRef.current;
    if (!webcamRef.current || !scanner || !window.cv) return;
    setCapturing(true);

    const screenshot = webcamRef.current.getScreenshot();
    const img = new Image();
    img.src = screenshot;
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const src = document.createElement("canvas");
    src.width = img.naturalWidth;
    src.height = img.naturalHeight;
    src.getContext("2d").drawImage(img, 0, 0);

    let resultCanvas = src;
    try {
      const extracted = scanner.extractPaper(src, img.naturalWidth, img.naturalHeight);
      if (extracted) resultCanvas = extracted;
    } catch (_) {
      // fall back to full image
    }

    setCapturing(false);

    const blob = await new Promise((resolve) => resultCanvas.toBlob(resolve, "image/jpeg", 0.92));
    const file = new File([blob], "receipt.jpg", { type: "image/jpeg" });
    const previewUrl = resultCanvas.toDataURL("image/jpeg");
    onCaptured({ file, previewUrl, fileType: "image" });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      {!cvReady && (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 6, gap: 2 }}>
          <CircularProgress sx={{ color: "custom.aiPurple" }} />
          <Typography variant="body2" color="text.secondary">
            Loading scanner engine…
          </Typography>
        </Box>
      )}

      {cvReady && (
        <Box sx={{ position: "relative", width: "100%", borderRadius: 2, overflow: "hidden" }}>
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={{ facingMode }}
            mirrored={false}
            style={{ width: "100%", display: "block" }}
          />
          <canvas
            ref={overlayRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
            }}
          />
        </Box>
      )}

      <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <IconButton
          onClick={() => setFacingMode((m) => (m === "environment" ? "user" : "environment"))}
          sx={{ color: "text.secondary" }}
        >
          <FlipCameraIosIcon />
        </IconButton>

        <IconButton
          onClick={handleCapture}
          disabled={!cvReady || capturing}
          sx={{
            width: 64,
            height: 64,
            bgcolor: "custom.aiPurple",
            color: "common.white",
            "&:hover": { bgcolor: "custom.aiPurple", opacity: 0.85 },
            "&.Mui-disabled": { bgcolor: "action.disabledBackground" },
          }}
        >
          {capturing ? <CircularProgress size={24} sx={{ color: "common.white" }} /> : <CameraAltIcon />}
        </IconButton>
      </Box>

      <Typography variant="caption" color="text.secondary" textAlign="center">
        Point at the receipt — the outline auto-detects
      </Typography>
    </Box>
  );
};

// ─── Dialog Shell ─────────────────────────────────────────────────────────────

export const ScannerDialog = ({ open, onClose, existingTags = [] }) => {
  const [source, setSource] = useState(null);
  const [savedReceipt, setSavedReceipt] = useState(null);
  const fileInputRef = useRef(null);

  const handleClose = () => {
    setSource(null);
    setSavedReceipt(null);
    onClose();
  };

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (file.type === "application/pdf") {
      setSource({ file, previewUrl: null, fileType: "pdf" });
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => setSource({ file, previewUrl: ev.target.result, fileType: "image" });
      reader.readAsDataURL(file);
    }
  };

  return (
    <AppModal
      open={open}
      onClose={handleClose}
      title={savedReceipt ? "Log Expense" : source ? "Review & Save" : "Scan Receipt"}
      showClose={false}
      actions={
        !source ? (
          <>
            <Button onClick={handleClose}>Cancel</Button>
            <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => fileInputRef.current?.click()}>
              Upload File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              style={{ display: "none" }}
              onChange={handleFileSelected}
            />
          </>
        ) : undefined
      }
    >
      {!source && <CameraStep onCaptured={setSource} />}
      {source && !savedReceipt && (
        <OcrStep
          source={source}
          existingTags={existingTags}
          onSaved={(receipt) => setSavedReceipt(receipt)}
          onRetake={() => setSource(null)}
        />
      )}
      {source && savedReceipt && (
        <ExpenseStep
          receiptId={savedReceipt.id}
          prefilledAmount={savedReceipt.amount}
          onDone={handleClose}
          onSkip={handleClose}
        />
      )}
    </AppModal>
  );
};
