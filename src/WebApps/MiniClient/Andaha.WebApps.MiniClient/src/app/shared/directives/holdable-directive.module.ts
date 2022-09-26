import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { HoldableDirective } from "./holdable.directive";

@NgModule({
  declarations: [HoldableDirective],
  exports: [HoldableDirective],
  imports: [CommonModule],
})

export class HoldableDirectiveModule {}
