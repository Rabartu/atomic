## AtFileInputComponent: at-file-input

## Usage

Add the element wherever you want to bind a [File | FileList] into a class model without additional elements.

Can also drop a file(s) into the component to bind the file(s) to it.

Example for usage:

```html
<at-file-input [(ngModel)]="files" color="primary" (select)="selectEvent($event)"
               accept=".ext,.anotherExt" [disabled]="disabled" multiple>
  <mat-icon>attach_file</mat-icon><span>Choose a file...</span>
</at-file-input>
```
 
```typescript
export class Demo {

  files: File | FileList;
  disabled: boolean = false;

  selectEvent(files: FileList | File): void {
    if (files instanceof FileList) {
      ...
    } else {
      ...
    }
  };
} 
```

## API Summary

Properties:

| Name | Type | Description |
| --- | --- | 650--- |
| color | string | Sets button color. Uses same color palette accepted as [MatButton].
| multiple | boolean | Sets if multiple files can be dropped/selected at once in [AtFileUploadComponent].
| accept | string | Sets files accepted when opening the file browser dialog. Same as "accept" attribute in `<input/>` element.
| disabled | boolean | Disables [AtFileUploadComponent] and clears selected/dropped files.
| select | function($event) | Event emitted when a file is selected. Emits a [File or FileList] object.
| clear | function() | Used to clear the selected files from the [AtFileInputComponent].

## Setup

Import the [CovalentFileModule] in your NgModule:

```typescript
import { CovalentFileModule } from '@covalent/core';
@NgModule({
  imports: [
    CovalentFileModule,
    ...
  ],
  ...
})
export class MyModule {}
```

---

## AtFileSelectDirective: atFileSelect

## Usage

Add the directive wherever you want to bind a [File | FileList] into a class model to an existing <input type="file"/> element.

Uses optional [(ngModel)] directive to bind file. (if [(ngModel]) exists, [fileSelect] is omitted)   

Example for usage:

```html
<input type="file" atFileSelect (fileSelect)="files = $event" multiple>
```

## API Summary

Properties:

| Name | Type | Description |
| --- | --- | 650--- |
| multiple | boolean | Sets whether multiple files can be selected at once in host element, or just a single file. Can also be "multiple" native attribute.
| fileSelect | function($event) | Event emitted when a file or files are selected in host [HTMLInputElement]. Emits a [FileList or File] object. Alternative to not use [(ngModel)].

---

## AtFileDropDirective: atFileDrop

## Usage

Add the directive wherever you want to add drop support to an element to bind a [File | FileList] into a class model.

To add effect when <code>ondragenter</code> event is executed, override <code>.drop-zone</code> class in the context you are using it.

Note: if element has child elements, add <code>* { pointer-events: none; }</code> to avoid event being thrown again while navigating in child elements.

Example for usage:

```html
<div atFileDrop (fileDrop)="files = $event" multiple [disabled]="disabled">
</div> 
```


## API Summary

Properties:

| Name | Type | Description |
| --- | --- | 650--- |
| multiple | boolean | Sets whether multiple files can be dropped at once in host element, or just a single file. Can also be "multiple" native attribute.
| disabled | boolean | Disabled drop events for host element.
| fileDrop | function($event) | Event emitted when a file or files are dropped in host element after being validated. Emits a [FileList or File] object.


---