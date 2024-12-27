export class JoinMessage {
  // message: string | undefined;
  // from: string | undefined;
  // date: string | undefined;
  // whisper: string | undefined;
  // sender: string | undefined;
  uid: string | null = null
  display: string | null = null
  constructor(json: any) {
    // this.message = Message.escapeXmlTags(json["text"]);
    // this.from = json["from"];
    // this.date = Message.getDateString(json["date"]);
    // this.whisper = json["whisper"];
    // let sender = this.participants[from] ? this.participants[from] : Message.escapeXmlTags(json["display"]);
    // console.log(sender)
    // console.log(msg)
    // console.log(dateString)

    this.uid = json["username"];
    this.display = json["display"];
    // this.participants[username] = Message.escapeXmlTags(display ? display : username);
    // if(username !== this.uid && $('#rp' + username).length === 0) {
    // if(username !== this.uid) {
      // Add to the participants list
      // $('#list').append('<li id="rp' + username + '" class="list-group-item">' + participants[username] + '</li>');
      // $('#rp' + username).css('cursor', 'pointer').click(function() {
      //   let username = $(this).attr('id').split("rp")[1];
      //   sendPrivateMsg(username);
      // });
    // }
  }
  // get mine(): boolean {
  //   return this.from == this.sender
  // }
}
