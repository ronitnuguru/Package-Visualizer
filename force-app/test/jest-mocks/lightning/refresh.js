export class RefreshEvent extends CustomEvent {
  static REFRESH_EVENT = "lightning__refresh";
  static REFRESH_DONE_EVENT = "lightning__refreshdone";
  static REFRESH_DONE_EVENT_DETAIL = "lightning__refreshdonedetail";
  static REFRESH_ERROR_EVENT = "lightning__refresherror";

  constructor() {
    super(RefreshEvent.REFRESH_EVENT, {
      bubbles: true,
      composed: true,
      cancelable: false
    });
  }
}
