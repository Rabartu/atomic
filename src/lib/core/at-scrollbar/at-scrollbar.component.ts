import {
    Component,
    Inject,
    ChangeDetectionStrategy,
    AfterViewInit,
    OnDestroy,
    Input,
    Output,
    EventEmitter,
    ViewChild,
    Renderer2,
    ElementRef,
    ViewEncapsulation
} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {Subscription} from 'rxjs/Subscription';
import {of} from 'rxjs/observable/of';
import {fromEvent} from 'rxjs/observable/fromEvent';
import {empty} from 'rxjs/observable/empty';

import {tap, take, takeWhile, expand, delay} from 'rxjs/operators';

@Component({
    selector: 'at-scrollbar',
    templateUrl: 'at-scrollbar.component.html',
    styleUrls: ['at-scrollbar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class AtScrollbarComponent implements AfterViewInit, OnDestroy {

    private SCROLLBAR_WIDTH = this.getScrollbarWidth();

    private _thumbSizeY = 0;
    private _thumbSizeX = 0;
    private _trackTopMax = 0;
    private _trackLeftMax = 0;
    private _scrollLeftMax = 0;
    private _scrollTopMax = 0;
    private _naturalThumbSizeY = 0;
    private _naturalThumbSizeX = 0;
    private _prevPageY = 0;
    private _prevPageX = 0;

    /** store current thumb position */
    private _currXPos = 0;
    private _currYPos = 0;

    private minThumbSize = 20;
    private observer: MutationObserver;
    private viewScrollSub$: Subscription;
    private barXClickSub$: Subscription;
    private barYClickSub$: Subscription;
    private thumbXDragSub$: Subscription;
    private thumbYDragSub$: Subscription;

    barX: HTMLElement;
    barY: HTMLElement;
    thumbX: HTMLElement;
    thumbY: HTMLElement;
    view: HTMLElement;

    @ViewChild('barX') barXRef: ElementRef;
    @ViewChild('barY') barYRef: ElementRef;
    @ViewChild('thumbX') thumbXRef: ElementRef;
    @ViewChild('thumbY') thumbYRef: ElementRef;
    @ViewChild('view') viewRef: ElementRef;

    @Input() render = true;
    @Input() autoUpdate = true;
    @Input() autoHide = true;
    @Input() trackX = false;
    @Input() trackY = true;
    @Input() viewClass: string;
    @Input() barClass: string;
    @Input() thumbClass: string;
    @Output() scrollState = new EventEmitter<MouseEvent>();

    constructor(private renderer: Renderer2, @Inject(DOCUMENT) private document: any) {
    }

    ngAfterViewInit() {
        if (this.render) {
            this.barX = this.barXRef.nativeElement;
            this.barY = this.barYRef.nativeElement;
            this.thumbX = this.thumbXRef.nativeElement;
            this.thumbY = this.thumbYRef.nativeElement;
            this.view = this.viewRef.nativeElement;

            this.viewScrollSub$ = fromEvent(this.view, 'scroll', (e) => this.scrollWorker(e)).subscribe();
            if (this.trackX) {
                this.barXClickSub$ = fromEvent(this.barX, 'mousedown', (e) => this.barXWorker(e)).subscribe();
                this.thumbXDragSub$ = fromEvent(this.thumbX, 'mousedown', (e) => this.thumbXWorker(e)).subscribe();
            }
            if (this.trackY) {
                this.barYClickSub$ = fromEvent(this.barY, 'mousedown', (e) => this.barYWorker(e)).subscribe();
                this.thumbYDragSub$ = fromEvent(this.thumbY, 'mousedown', (e) => this.thumbYWorker(e)).subscribe();
            }

            if (this.barClass) {
                this.renderer.addClass(this.barX, this.barClass);
                this.renderer.addClass(this.barY, this.barClass);
            }

            if (this.thumbClass) {
                this.renderer.addClass(this.thumbX, this.thumbClass);
                this.renderer.addClass(this.thumbY, this.thumbClass);
            }

            if (this.viewClass) {
                this.renderer.addClass(this.view, this.viewClass);
            }

            /** Hide native scrollbars */
            this.hideNativeScrollbars(this.SCROLLBAR_WIDTH);

            /** Initialize calculation variables */
            this.scrollWorker(null);

            if (this.autoUpdate) {
                /** Observe content changes */
                this.observer = new MutationObserver(() => this.update());

                const config: MutationObserverInit = {
                    subtree: true,
                    childList: true
                };

                this.observer.observe(this.view, config);
            }
        }

    }

    ngOnDestroy() {
        if (this.render) {
            this.viewScrollSub$.unsubscribe();
            if (this.trackX) {
                this.barXClickSub$.unsubscribe();
                this.thumbXDragSub$.unsubscribe();
            }
            if (this.trackY) {
                this.barYClickSub$.unsubscribe();
                this.thumbYDragSub$.unsubscribe();
            }
            if (this.observer) {
                this.observer.disconnect();
            }
        }
    }

    /**
     * Update when content changes
     */
    update() {
        of({}).pipe(
            take(1),
            tap(() => {
                this.setThumbXPosition(this._currXPos, this.calculateThumbXSize());
                this.setThumbYPosition(this._currYPos, this.calculateThumbYSize());
            })
        ).subscribe();
    }

    /**
     * Scroll Worker
     * @param {MouseEvent} e
     */
    scrollWorker(e: MouseEvent) {
        this._thumbSizeX = this.thumbX.clientWidth;
        this._thumbSizeY = this.thumbY.clientHeight;

        this._trackLeftMax = this.barX.clientWidth - this._thumbSizeX;
        this._trackTopMax = this.barY.clientHeight - this._thumbSizeY;

        const thumbXPosition = this.view.scrollLeft * this._trackLeftMax / this._scrollLeftMax;
        const thumbYPosition = this.view.scrollTop * this._trackTopMax / this._scrollTopMax;

        this.setThumbXPosition(thumbXPosition, this.calculateThumbXSize());
        this.setThumbYPosition(thumbYPosition, this.calculateThumbYSize());

        /** Emit scroll state */
        this.scrollState.emit(e);
    }

    /**
     * Horizontal thumb worker
     * @param {MouseEvent} e
     */
    thumbXWorker(e: MouseEvent) {

        /** Start dragging scrollbar on mouseMove */
        const startDrag = (event: MouseEvent) => {
            this._prevPageX = this._thumbSizeX - e.offsetX;
            const offset = event.clientX - this.barX.getBoundingClientRect().left;
            const thumbClickPosition = this._thumbSizeX - this._prevPageX;
            const scrollLeft = this._scrollLeftMax * (offset - thumbClickPosition) / this._trackLeftMax;
            this.renderer.setProperty(this.view, 'scrollLeft', scrollLeft);
        };

        /** Reset and remove listeners on mouseUp */
        const endDrag = () => {
            disableSelection();
            mouseMoveSub$.unsubscribe();
            mouseUpSub$.unsubscribe();
            this._prevPageX = 0;
        };

        /** Disable selection while dragging scrollbars */
        const disableSelection = this.renderer.listen(this.document, 'selectstart', () => false);
        const mouseMoveSub$ = fromEvent(this.document.body, 'mousemove', startDrag).subscribe();
        const mouseUpSub$ = fromEvent(this.document.body, 'mouseup', endDrag).subscribe();
    }

    /**
     * Vertical thumb worker
     * @param {MouseEvent} e
     */
    thumbYWorker(e: MouseEvent) {

        /** Start dragging scrollbar on mouseMove */
        const startDrag = (event: MouseEvent) => {
            this._prevPageY = this._thumbSizeY - e.offsetY;
            const offset = event.clientY - this.barY.getBoundingClientRect().top;
            const thumbClickPosition = this._thumbSizeY - this._prevPageY;
            const scrollTop = this._scrollTopMax * (offset - thumbClickPosition) / this._trackTopMax;
            this.renderer.setProperty(this.view, 'scrollTop', scrollTop);
        };

        /** Reset and remove listeners on mouseUp */
        const endDrag = () => {
            disableSelection();
            mouseMoveSub$.unsubscribe();
            mouseUpSub$.unsubscribe();
            this._prevPageY = 0;
        };

        /** Disable selection while dragging scrollbars */
        const disableSelection = this.renderer.listen(this.document, 'selectstart', () => false);
        const mouseMoveSub$ = fromEvent(this.document.body, 'mousemove', startDrag).subscribe();
        const mouseUpSub$ = fromEvent(this.document.body, 'mouseup', endDrag).subscribe();
    }

    /**
     * Horizontal scrollbar click worker
     * @param {MouseEvent} e
     */
    barXWorker(e: MouseEvent) {
        if (e.target === e.currentTarget) {
            const offset = e.offsetX - this._naturalThumbSizeX * .5;
            const thumbPositionPercentage = offset * 100 / this.barX.clientWidth;
            const scrollLeft = thumbPositionPercentage * this.view.scrollWidth / 100;
            this.renderer.setProperty(this.view, 'scrollLeft', scrollLeft);
        }
    }

    /**
     * Vertical scrollbar click worker
     * @param {MouseEvent} e
     */
    barYWorker(e: MouseEvent) {
        if (e.target === e.currentTarget) {
            const offset = e.offsetY - this._naturalThumbSizeY * .5;
            const thumbPositionPercentage = offset * 100 / this.barY.clientHeight;
            const scrollTop = thumbPositionPercentage * this.view.scrollHeight / 100;
            this.renderer.setProperty(this.view, 'scrollTop', scrollTop);
        }
    }

    /**
     * Scroll horizontally
     * @param {number} to
     * @param {number} duration
     */
    scrollXTo(to: number, duration = 200) {

        of(duration).pipe(
            takeWhile(() => duration > 0),
            expand(d => {
                if (d > 0) {
                    const difference = to - this.view.scrollLeft;
                    const perTick = difference / d * 10;
                    this.renderer.setProperty(this.view, 'scrollLeft', this.view.scrollLeft + perTick);
                    return of(d - 10).pipe(delay(10));
                } else {
                    duration = d;
                    return empty();
                }
            })
        ).subscribe();
    }

    /**
     * Scroll vertically
     * @param {number} to
     * @param {number} duration
     */
    scrollYTo(to: number, duration = 200) {

        of(duration).pipe(
            takeWhile(() => duration > 0),
            expand(d => {
                if (d > 0) {
                    const difference = to - this.view.scrollTop;
                    const perTick = difference / d * 10;
                    this.renderer.setProperty(this.view, 'scrollTop', this.view.scrollTop + perTick);
                    return of(d - 10).pipe(delay(10));
                } else {
                    duration = d;
                    return empty();
                }
            })
        ).subscribe();
    }

    /**
     * Calculate Thumb X Size
     * @return {number}
     */
    private calculateThumbXSize(): number {
        this._naturalThumbSizeX = this.barX.clientWidth / this.view.scrollWidth * this.barX.clientWidth;
        this._scrollLeftMax = this.view.scrollWidth - this.view.clientWidth;
        return this.scrollBoundaries(this._naturalThumbSizeX, this._scrollLeftMax);
    }

    /**
     * Calculate Thumb Y Size
     * @return {number}
     */
    private calculateThumbYSize(): number {
        this._naturalThumbSizeY = this.barY.clientHeight / this.view.scrollHeight * this.barY.clientHeight;
        this._scrollTopMax = this.view.scrollHeight - this.view.clientHeight;
        return this.scrollBoundaries(this._naturalThumbSizeY, this._scrollTopMax);
    }

    /**
     * Get scrollbar thumb size
     * @param {number} naturalThumbSize
     * @param {number} scrollMax
     * @return {number}
     */
    private scrollBoundaries(naturalThumbSize: number, scrollMax: number): number {
        if (naturalThumbSize < this.minThumbSize) {
            return this.minThumbSize;
        } else if (scrollMax) {
            return naturalThumbSize;
        } else {
            return 0;
        }
    }

    /**
     * Set horizontal scrollbar thumb style
     * @param {number} x
     * @param {number} width
     * @return {any}
     */
    private setThumbXPosition(x: number, width: number): any {
        this.renderer.setStyle(this.thumbX, 'msTransform', `translate(${x}, 0)`);
        this.renderer.setStyle(this.thumbX, 'webkitTransform', `translate3d(${x}px, 0, 0)`);
        this.renderer.setStyle(this.thumbX, 'transform', `translate3d(${x}px, 0, 0)`);
        this.renderer.setStyle(this.thumbX, 'width', width + 'px');
        this._currXPos = x;
    }

    /**
     * Set vertical scrollbar thumb style
     * @param {number} y
     * @param {number} height
     * @return {any}
     */
    private setThumbYPosition(y: number, height: number): any {
        this.renderer.setStyle(this.thumbY, 'msTransform', `translate(0, ${y})`);
        this.renderer.setStyle(this.thumbY, 'webkitTransform', `translate3d(0, ${y}px, 0)`);
        this.renderer.setStyle(this.thumbY, 'transform', `translate3d(0, ${y}px, 0)`);
        this.renderer.setStyle(this.thumbY, 'height', height + 'px');
        this._currYPos = y;
    }

    /**
     * Hide native scrollbars
     * @param {number} size
     */
    private hideNativeScrollbars(size: number) {
        this.renderer.setStyle(this.view, 'width', `calc(100% + ${size}px)`);
        this.renderer.setStyle(this.view, 'height', `calc(100% + ${size}px)`);
    }

    /**
     * Get the original scrollbar width
     * @return {number}
     */
    private getScrollbarWidth(): number {
        const e = this.renderer.createElement('div');
        e.style.position = 'absolute';
        e.style.top = '-9999px';
        e.style.width = '100px';
        e.style.height = '100px';
        e.style.overflow = 'scroll';
        e.style.msOverflowStyle = 'scrollbar';
        this.renderer.appendChild(this.document.body, e);
        const sw = (e.offsetWidth - e.clientWidth);
        this.renderer.removeChild(this.document.body, e);
        return sw;
    }
}