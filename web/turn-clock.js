// A deadline belongs to one human turn; rerenders do not restart it.
export class TurnClock {
 constructor(now=()=>Date.now()){this.now=now;this.key=null;this.deadline=0;this.expired=false;this.pausedAt=null}
 start(key){if(key!==this.key){this.key=key;this.deadline=this.now()+60000;this.expired=false;this.pausedAt=null}return this.remaining()}
 stop(){this.key=null;this.deadline=0;this.expired=false;this.pausedAt=null}
 pause(){if(this.key!==null&&this.pausedAt===null)this.pausedAt=this.now()}
 resume(){if(this.pausedAt!==null){this.deadline+=this.now()-this.pausedAt;this.pausedAt=null}}
 remaining(){return this.key===null?60:Math.max(0,Math.ceil((this.deadline-(this.pausedAt??this.now()))/1000))}
 claimExpiry(){if(this.key===null||this.expired||this.pausedAt!==null||this.remaining()>0)return false;this.expired=true;return true}
}
