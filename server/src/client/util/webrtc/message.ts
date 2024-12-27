export class Message {
  message: string | undefined
  from: string | undefined
  date: string | undefined
  whisper: string | undefined
  sender: string | undefined
  constructor(json: any) {
    this.message = Message.escapeXmlTags(json["text"]);
    this.from = json["from"];
    this.date = Message.getDateString(json["date"]);
    this.whisper = json["whisper"];
    // let sender = this.participants[from] ? this.participants[from] : Message.escapeXmlTags(json["display"]);
    // console.log(sender)
    // console.log(msg)
    // console.log(dateString)
  }

  static escapeXmlTags(value: string) {
    if(value) {
      let escapedValue = value.replace(new RegExp('<', 'g'), '&lt');
      escapedValue = escapedValue.replace(new RegExp('>', 'g'), '&gt');
      return escapedValue;
    }
  }
  
  static getDateString(jsonDate: string) {
    let when = new Date();
    if(jsonDate) {
      when = new Date(Date.parse(jsonDate));
    }
    let dateString =
        ("0" + when.getUTCHours()).slice(-2) + ":" +
        ("0" + when.getUTCMinutes()).slice(-2) + ":" +
        ("0" + when.getUTCSeconds()).slice(-2);
    return dateString;
  }
}