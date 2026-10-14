import{D as i,a as s,S as u,c as k,g as F,i as $,b as A,d as z,e as S}from"./utils-CpYcuoze.js";import{s as f,t as D,a as R,b as L,c as H,E as U,d as v,e as j}from"./features-WjIVO5NO.js";const e={generatedColor:null,startTime:null,score:0,tipCount:0,timerInterval:null,computerTipCount:0,isGameActive:!1,difficulty:"easy"};function W(){e.generatedColor=null,e.startTime=null,e.tipCount=0,e.timerInterval&&clearInterval(e.timerInterval),e.timerInterval=null,e.computerTipCount=0,e.isGameActive=!1}function O(o){e.difficulty=o;const n=i[o];e.tipCount=n.tipCount,e.computerTipCount=n.computerTipCount}function P(o){const n=Math.floor(o/3600);o%=3600;const t=Math.floor(o/60),a=o%60;let c="";return n>0&&(c+=`${n} óra `),(t>0||n>0)&&(c+=`${t} perc `),c+=`${a} másodperc`,c}function I(o){s.userColor.style.backgroundColor=o}function b(o,n=""){s.randomColor.style.backgroundColor=o,s.randomColor.textContent=n}function d(o){s.feedback.textContent=o,s.feedback.classList.remove("feedback-animate"),s.feedback.offsetWidth,s.feedback.classList.add("feedback-animate")}function N(){const o=Math.floor((Date.now()-e.startTime)/1e3);s.timer.textContent=P(o)}function E(){s.score.textContent=e.score}function Y(o){const n=parseInt(o.substring(0,2),16),t=parseInt(o.substring(2,4),16),a=parseInt(o.substring(4,6),16);s.plusRedButton.disabled=n>=255,s.minusRedButton.disabled=n<=0,s.plusGreenButton.disabled=t>=255,s.minusGreenButton.disabled=t<=0,s.plusBlueButton.disabled=a>=255,s.minusBlueButton.disabled=a<=0}function G(){e.computerTipCount>0?(s.computerGuessButton.disabled=!1,s.computerGuessButton.textContent=u.computerTip(e.computerTipCount)):(s.computerGuessButton.disabled=!0,s.computerGuessButton.textContent=u.noMoreTips)}function X(){document.body.classList.add("modal-open")}function ne(){document.body.classList.remove("modal-open")}function V(){s.correctColorCode.textContent=e.generatedColor,X()}function M(){s.checkButton.disabled=!0,s.computerGuessButton.disabled=!0,s.allSecondaryButtons.forEach(o=>o.disabled=!0)}function _(){s.checkButton.disabled=!1,s.computerGuessButton.disabled=!1,s.allSecondaryButtons.forEach(o=>o.disabled=!1)}function g(o){try{new Audio(`/${o}.mp3`).play()}catch(n){console.error("Hangfájl hiba: ",n),d("Hiba történt a hang lejátszása közben.")}}function x(o){o?s.randomColor.classList.add("pulsing"):s.randomColor.classList.remove("pulsing")}function q(){s.colorInput.value="",s.userColor.style.backgroundColor="#FFFFFF",s.feedback.textContent="",s.timer.textContent="0",E()}function J(){try{const o=f.get("game_history",[]),n=f.getHighScores(),t=o.length,a=o.filter(r=>r.won).length,c=o.reduce((r,B)=>r+(B.accuracy||0),0),l=document.getElementById("total-games");l&&(l.textContent=t.toString());const p=document.getElementById("win-rate");if(p){const r=t>0?a/t*100:0;p.textContent=`${Math.round(r)}%`}const C=document.getElementById("best-score");if(C){const r=n.length>0?n[0].score:0;C.textContent=r.toString()}const y=document.getElementById("avg-accuracy");if(y){const r=t>0?c/t:0;y.textContent=`${Math.round(r)}%`}console.log("📈 Statistics updated:",{totalGames:t,winRate:`${Math.round(a/t*100||0)}%`,bestScore:n.length>0?n[0].score:0,avgAccuracy:`${Math.round(c/t||0)}%`})}catch(o){console.error("❌ Failed to update statistics:",o),Object.entries({"total-games":"0","win-rate":"0%","best-score":"0","avg-accuracy":"0%"}).forEach(([t,a])=>{const c=document.getElementById(t);c&&(c.textContent=a)})}}function T(o,n="info",t=3e3){const a=document.createElement("div");a.className=`toast toast-${n}`;const c={success:"✅",warning:"⚠️",error:"❌",info:"ℹ️"};if(a.innerHTML=`
    <div class="toast-content">
      <span class="toast-icon">${c[n]||c.info}</span>
      <span class="toast-message">${o}</span>
    </div>
  `,a.style.cssText=`
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${K(n)};
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    max-width: 300px;
    animation: slideInRight 0.3s ease-out;
    font-weight: 500;
  `,!document.querySelector("#toast-styles")){const l=document.createElement("style");l.id="toast-styles",l.textContent=`
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
      
      .toast-content {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .toast-icon {
        font-size: 16px;
      }
      
      .toast-message {
        font-size: 14px;
      }
    `,document.head.appendChild(l)}document.body.appendChild(a),setTimeout(()=>{a.style.animation="slideOutRight 0.3s ease-in",setTimeout(()=>{a.parentElement&&a.remove()},300)},t)}function K(o){const n={success:"#28a745",warning:"#ffc107",error:"#dc3545",info:"#17a2b8"};return n[o]||n.info}function m(o,n){const t=document.createElement("div");if(t.className="achievement-notification",t.innerHTML=`
    <div class="achievement-content">
      <div class="achievement-icon">🏆</div>
      <div class="achievement-text">
        <div class="achievement-title">Achievement Unlocked!</div>
        <div class="achievement-name">${o}</div>
        <div class="achievement-desc">${n}</div>
      </div>
    </div>
  `,t.style.cssText=`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #ffd700, #ffed4a);
    color: #333;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    z-index: 10001;
    max-width: 400px;
    text-align: center;
    animation: achievementPop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  `,!document.querySelector("#achievement-styles")){const a=document.createElement("style");a.id="achievement-styles",a.textContent=`
      @keyframes achievementPop {
        0% {
          transform: translate(-50%, -50%) scale(0.5);
          opacity: 0;
        }
        100% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 1;
        }
      }
      
      .achievement-content {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      
      .achievement-icon {
        font-size: 48px;
      }
      
      .achievement-title {
        font-weight: bold;
        font-size: 14px;
        margin-bottom: 4px;
      }
      
      .achievement-name {
        font-weight: bold;
        font-size: 18px;
        margin-bottom: 4px;
      }
      
      .achievement-desc {
        font-size: 12px;
        opacity: 0.8;
      }
    `,document.head.appendChild(a)}document.body.appendChild(t),setTimeout(()=>{t.style.animation="achievementPop 0.3s reverse",setTimeout(()=>{t.parentElement&&t.remove()},300)},4e3)}function Q(){e.timerInterval&&clearInterval(e.timerInterval),e.timerInterval=setInterval(N,1e3)}function Z(){const o=Math.floor((Date.now()-e.startTime)/1e3),n=i[e.difficulty].score,t=Math.max(0,n-o);e.score+=t}function h(){if(!e.generatedColor||!s.colorInput.value)return 0;const o="#"+s.colorInput.value.replace("#",""),n=e.generatedColor,t=z(o,n),a=Math.max(0,Math.min(100,100-t/100*100));return Math.round(a*100)/100}function ee(o,n){if(o)try{const t=f.getGameStats(),a=f.getHighScores();t.gamesWon===1&&m("First Victory","Congratulations on your first successful color match!"),[5,10,25,50,100].includes(t.gamesWon)&&m(`${t.gamesWon} Wins`,`You've successfully completed ${t.gamesWon} games!`),a.length>0&&n===a[0].score&&m("New High Score!",`Amazing! You scored ${n} points!`),h()===100&&m("Perfect Match","Incredible! You got the exact color!"),Date.now()-e.startTime<1e4&&m("Lightning Fast","You completed the game in under 10 seconds!"),e.difficulty==="hard"&&m("Hard Mode Master","Excellent work completing hard difficulty!")}catch(t){console.error("❌ Failed to check achievements:",t)}}function w(o){clearInterval(e.timerInterval),e.isGameActive=!1;const n=Date.now()-e.startTime,t=e.difficulty,a=h(),c=o?e.score:0;o?(d(u.congratulations),g("correct"),Z(),E(),v(!0,e.score,n,t,a),f.recordGame({won:!0,score:e.score,time:n,difficulty:t,accuracy:a,targetColor:e.generatedColor,attempts:i[t].tips-e.tipCount+1,computerTipsUsed:i[t].tips-e.computerTipCount,timestamp:Date.now()}),console.log("🎉 Game won!",{score:e.score,time:`${Math.round(n/1e3)}s`,accuracy:`${a}%`,difficulty:t})):(d(u.sorry),g("wrong"),v(!1,0,n,t,a),f.recordGame({won:!1,score:0,time:n,difficulty:t,accuracy:a,targetColor:e.generatedColor,attempts:i[t].tips+1,computerTipsUsed:i[t].tips-e.computerTipCount,timestamp:Date.now()}),console.log("💔 Game lost",{time:`${Math.round(n/1e3)}s`,accuracy:`${a}%`,difficulty:t,targetColor:e.generatedColor})),j("game-session",{won:o,difficulty:t,score:c}),J(),ee(o,c),o?T(`🎉 Congratulations! Score: ${c}`,"success",4e3):T(`😔 Better luck next time! Target was ${e.generatedColor}`,"warning",4e3),V(),M()}function ae(){if(!e.isGameActive)return;const o="#"+s.colorInput.value.replace("#",""),n=o.toUpperCase()===e.generatedColor,t=h();if(L.trackColorGuess(o,e.generatedColor,t,n),n)w(!0);else if(e.tipCount--,H(U.COLOR_GUESS,{attempt:i[e.difficulty].tips-e.tipCount,totalAttempts:i[e.difficulty].tips,accuracy:t,remainingTips:e.tipCount,difficulty:e.difficulty}),e.tipCount>0){let a=u.tryAgain(e.tipCount);a+=k(o,e.generatedColor),d(a),console.log(`🎯 Color guess: ${t}% accuracy, ${e.tipCount} tips remaining`)}else w(!1)}function se(){if(e.computerTipCount<=0||!e.isGameActive)return;const o=[{text:"Ez közel lehet!",type:"close"},{text:"Ez csak egy tipp, ne bízz meg benne!",type:"wrong"},{text:"Ez csak vicc volt!",type:"silly"}],n=o[Math.floor(Math.random()*o.length)];let t;switch(n.type){case"close":t=F(e.generatedColor);break;case"wrong":t=S();break;case"silly":t="#FFFFFF";break}s.colorInput.value=t.replace("#",""),I(t),d(n.text),e.computerTipCount--,G()}function ce(o,n){if(!e.isGameActive)return;let t=s.colorInput.value.replace("#","");$(t)||(t="000000",d(u.invalidColor));const a=A(t,o,n);s.colorInput.value=a,s.colorAdjust.value="#"+a,I("#"+a);const c=k(a,e.generatedColor);d(c),Y(a)}function re(){W(),O(s.difficulty.value),q(),e.generatedColor=S(),b(e.generatedColor,u.memorizeColor),x(!0),M(),D(e.difficulty,e.generatedColor),R("game-session"),setTimeout(()=>{b("#FFFFFF",""),x(!1),e.isGameActive=!0,g("start"),_(),G(),e.startTime=Date.now(),Q()},3e3)}export{O as a,se as b,ae as c,I as d,Y as e,ce as f,ne as h,re as s,J as u};
//# sourceMappingURL=game-BlvZb4Jo.js.map
