import { IoMdCheckmark, IoMdClose, IoMdInformationCircle, IoMdWarning } from 'react-icons/io';
import type { ToastState } from '../../hooks/useToast';
import './Toast.css';

interface ToastProps extends ToastState {
  onClose: () => void;
}

const ICON_MAP = {
  success: <IoMdCheckmark size={16} color="#fff" />,
  warning: <IoMdWarning size={16} color="#fff" />,
  error:   <IoMdWarning size={16} color="#fff" />,
  info:    <IoMdInformationCircle size={16} color="#fff" />,
};

function Toast({ visible, message, type, onClose }: ToastProps) {
  if (!visible) return null;

  return (
    <div className={`app-toast app-toast--${type}`} role="status" aria-live="polite">
      <span className="app-toast__icon">{ICON_MAP[type]}</span>
      <span className="app-toast__message">{message}</span>
      <button className="app-toast__close" onClick={onClose} aria-label="닫기">
        <IoMdClose size={14} color="#fff" />
      </button>
    </div>
  );
}

export default Toast;