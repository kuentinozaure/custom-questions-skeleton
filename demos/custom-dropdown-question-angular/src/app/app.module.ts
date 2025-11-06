import { NgModule, Component } from '@angular/core';
import { BrowserModule, DomSanitizer } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

import { TemplateRendererComponent } from './components/template-renderer/template-renderer.component';
import { DropdownComponent } from './components/dropdown/dropdown.component';

// Create a minimal root component for bootstrapping
@Component({
  selector: 'app-root',
  template: '<div id="learnosity-questions-root"></div>',
  standalone: false
})
export class AppRootComponent { }

@NgModule({
  declarations: [AppRootComponent],
  imports: [
    BrowserModule,
    CommonModule,
    TemplateRendererComponent, // Import standalone component
    DropdownComponent // Import standalone component
  ],
  providers: [],
  bootstrap: [AppRootComponent]
})
export class AppModule { }
