"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./dialog";
import { ReactNode } from "react";

interface ModalBaseProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  description?: string;
  footer?: ReactNode;
  width?: string;
}

export default function ModalBase({ open, onClose, children, title, description, footer, width = "sm:max-w-lg" }: ModalBaseProps) {
  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className={`bg-background text-foreground rounded shadow-lg p-8 min-w-[320px] w-full ${width}`}>
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        {children}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
