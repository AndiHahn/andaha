import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// Host der Analyse-Seiten unter /bill/analysis; Tabs und Hauptleiste kommen von app-bill bzw. der Shell
@Component({
    selector: 'app-bill-analysis',
    templateUrl: './bill-analysis.component.html',
    styleUrls: ['./bill-analysis.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterOutlet]
})
export class BillAnalysisComponent {
}
