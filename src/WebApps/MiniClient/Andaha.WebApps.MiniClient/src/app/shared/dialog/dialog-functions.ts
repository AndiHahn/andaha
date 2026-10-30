import { MatDialogConfig } from "@angular/material/dialog";

export function getDialogBaseConfig<D = any>(): MatDialogConfig<D> {
  const screenWidth = window.innerWidth;
  if (screenWidth < 600) {
    return {
      panelClass: 'andaha-sheet',
      position: { bottom: '0' },
      width: '100%',
      maxWidth: '100vw',
    };
  }

  return {
    panelClass: 'andaha-dialog',
    maxWidth: '480px',
    width: '100%',
  };
}
