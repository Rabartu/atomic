import {ChangeDetectionStrategy, Component, Input, ViewEncapsulation} from '@angular/core';

@Component({
    selector: 'at-layout-card-over',
    templateUrl: './at-layout-card-over.component.html',
    styleUrls: ['./at-layout-card-over.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
})
export class AtLayoutCardOverComponent {

    private _cardOffsetTop: number = -60;
    private _cardOffsetBottom: number = 20;

    @Input() cardWidth: string = '75%';

    @Input() cardAlign: 'left' | 'center' | 'right' = 'center';

    @Input()
    set cardOffsetTop(cot: number) {
        if (cot) {
            this._cardOffsetTop = cot * -1;
        }
    }

    get cardOffsetTop(): number {
        return this._cardOffsetTop;
    }

    @Input()
    set cardOffsetBottom(cob: number) {
        if (cob) {
            this._cardOffsetBottom = cob * -1;
        }
    }

    get cardOffsetBottom(): number {
        return this._cardOffsetBottom;
    }

}
