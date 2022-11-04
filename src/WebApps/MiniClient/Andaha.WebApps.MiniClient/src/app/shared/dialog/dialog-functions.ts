import { MatDialogConfig } from "@angular/material/dialog";

export function getDialogBaseConfig<D = any>(): MatDialogConfig<D> {
  const screenWidth = window.innerWidth;
  if (screenWidth < 600) {
    return {
      panelClass: 'fullscreen-dialog',
      height: '100vh',
      width: '100%',
    };
  }

  return {};
}
