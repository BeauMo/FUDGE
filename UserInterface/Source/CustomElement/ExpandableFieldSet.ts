namespace FudgeUserInterface {
  import ƒ = FudgeCore;

  export class ExpandableFieldSet extends HTMLFieldSetElement {
    public content: HTMLDivElement;
    private expander: HTMLInputElement;

    public constructor(_legend: string = "") {
      super();
      let cntLegend: HTMLLegendElement = document.createElement("legend");

      this.expander = document.createElement("input");
      this.expander.type = "checkbox";
      this.expander.checked = true;
      this.expander.tabIndex = -1;
      let lblTitle: HTMLSpanElement = document.createElement("span");
      lblTitle.textContent = _legend;
      this.appendChild(this.expander);
      cntLegend.appendChild(lblTitle);

      this.content = document.createElement("div");

      this.appendChild(cntLegend);
      this.appendChild(this.content);

      this.tabIndex = 0;
      this.addEventListener(EVENT.KEY_DOWN, this.hndKey);
      this.addEventListener(EVENT.FOCUS_NEXT, this.hndFocus);
      this.addEventListener(EVENT.FOCUS_PREVIOUS, this.hndFocus);
      this.addEventListener(EVENT.FOCUS_SET, this.hndFocus);
      this.expander.addEventListener("input", this.hndToggle);
      // this.expander.addEventListener("change", this.hndToggle);
    }

    public get isExpanded(): boolean {
      return this.expander.checked;
    }

    public expand(_expand: boolean): void {
      this.expander.checked = _expand;
      this.hndToggle(null);
    }

    private hndToggle = (_event: Event): void => {
      if (_event)
        _event.stopPropagation();
      this.dispatchEvent(new Event(this.isExpanded ? EVENT.EXPAND : EVENT.COLLAPSE, { bubbles: true }));
    }

    private hndFocus = (_event: Event): void => {
      switch (_event.type) {
        case EVENT.FOCUS_NEXT:
          let next: HTMLElement = <HTMLElement>this.nextElementSibling;
          if (next && next.tabIndex > -1) {
            next.focus();
            _event.stopPropagation();
          }
          break;
        case EVENT.FOCUS_PREVIOUS:
          let previous: HTMLElement = <HTMLElement>this.previousElementSibling;
          if (previous && previous.tabIndex > -1) {
            let fieldsets: NodeListOf<HTMLFieldSetElement> = previous.querySelectorAll("fieldset");
            let i: number = fieldsets.length;
            if (i)
              do { // focus the last visible fieldset
                fieldsets[--i].focus();
              } while (!fieldsets[i].offsetParent);
            else
              previous.focus();


            _event.stopPropagation();
          }
          break;
        case EVENT.FOCUS_SET:
          if (_event.target != this) {
            this.focus();
            _event.stopPropagation();
          }
          break;
      }
    }

    private hndKey = (_event: KeyboardEvent): void => {
      _event.stopPropagation();
      // let target: HTMLElement = <HTMLElement>_event.target;

      switch (_event.code) {
        case ƒ.KEYBOARD_CODE.ARROW_RIGHT:
          if (!this.isExpanded) {
            this.expand(true);
            return;
          }
        case ƒ.KEYBOARD_CODE.ARROW_DOWN:
          let next: HTMLElement = this;
          if (this.isExpanded)
            next = this.querySelector("fieldset");
          else
            do {
              next = <HTMLElement>next.nextElementSibling;
            } while (next && next.tabIndex > -1);

          if (next)
            next.focus();
          // next.dispatchEvent(new KeyboardEvent(EVENT_TREE.FOCUS_NEXT, { bubbles: true, shiftKey: _event.shiftKey, ctrlKey: _event.ctrlKey }));
          else
            this.dispatchEvent(new KeyboardEvent(EVENT.FOCUS_NEXT, { bubbles: true, shiftKey: _event.shiftKey, ctrlKey: _event.ctrlKey }));
          break;
        case ƒ.KEYBOARD_CODE.ARROW_LEFT:
          if (this.isExpanded) {
            this.expand(false);
            return;
          }
        case ƒ.KEYBOARD_CODE.ARROW_UP:
          let previous: HTMLElement = this;
          do {
            previous = <HTMLElement>previous.previousElementSibling;
          } while (previous && !(previous instanceof ExpandableFieldSet));

          if (previous)
            if ((<ExpandableFieldSet>previous).isExpanded)
              this.dispatchEvent(new KeyboardEvent(EVENT.FOCUS_PREVIOUS, { bubbles: true, shiftKey: _event.shiftKey, ctrlKey: _event.ctrlKey }));
            else
              previous.focus();
          else
            this.parentElement.dispatchEvent(new KeyboardEvent(EVENT.FOCUS_SET, { bubbles: true, shiftKey: _event.shiftKey, ctrlKey: _event.ctrlKey }));
          break;
      }
    }
  }

  customElements.define("ui-fold-fieldset", ExpandableFieldSet, { extends: "fieldset" });
}
