import { Component } from '@angular/core';

@Component({
  selector: 'app-test-renderer',
  standalone: true,
  template: `<div>Test Component Works!</div>`,
  styles: [`
    div {
      padding: 10px;
      background-color: #f0f0f0;
      border: 1px solid #ccc;
    }
  `]
})
export class TestRendererComponent {
  constructor() {
    console.log('TestRendererComponent constructor called');
  }
}
