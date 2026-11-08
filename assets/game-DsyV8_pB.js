import{a as e,c as t,i as n,l as r,n as i,o as a,r as o,s,t as c}from"./utils-CjoDqZC9.js";import{c as l,d as u,f as d,l as f,o as p,r as m,s as h,u as g}from"./features-Cw1NAil4.js";var _={generatedColor:null,startTime:null,score:0,tipCount:0,timerInterval:null,memorizeTimeout:null,computerTipCount:0,isGameActive:!1,difficulty:`easy`};function v(){_.generatedColor=null,_.startTime=null,_.tipCount=0,_.timerInterval&&clearInterval(_.timerInterval),_.timerInterval=null,_.memorizeTimeout&&clearTimeout(_.memorizeTimeout),_.memorizeTimeout=null,_.computerTipCount=0,_.isGameActive=!1}function y(e){_.difficulty=e;let t=s[e];_.tipCount=t.tipCount,_.computerTipCount=t.computerTipCount}var b={correct:new URL(new URL(`correct-Diw_h335.mp3`,import.meta.url).href,``+import.meta.url).href,wrong:new URL(new URL(`wrong-C8JtCPL9.mp3`,import.meta.url).href,``+import.meta.url).href};function x(e){let t=Math.floor(e/3600);e%=3600;let n=Math.floor(e/60),r=e%60,i=``;return t>0&&(i+=`${t} óra `),(n>0||t>0)&&(i+=`${n} perc `),i+=`${r} másodperc`,i}function S(e){t.userColor.style.backgroundColor=e}function C(e,n=``){t.randomColor.style.backgroundColor=e,t.randomColor.textContent=n}function w(e){t.feedback.textContent=e,t.feedback.classList.remove(`feedback-animate`),t.feedback.offsetWidth,t.feedback.classList.add(`feedback-animate`)}function T(){let e=Math.floor((Date.now()-_.startTime)/1e3);t.timer.textContent=x(e)}function E(){t.score.textContent=_.score}function D(e){let n=parseInt(e.substring(0,2),16),r=parseInt(e.substring(2,4),16),i=parseInt(e.substring(4,6),16);t.plusRedButton.disabled=n>=255,t.minusRedButton.disabled=n<=0,t.plusGreenButton.disabled=r>=255,t.minusGreenButton.disabled=r<=0,t.plusBlueButton.disabled=i>=255,t.minusBlueButton.disabled=i<=0}function O(){_.computerTipCount>0?(t.computerGuessButton.disabled=!1,t.computerGuessButton.textContent=r.computerTip(_.computerTipCount)):(t.computerGuessButton.disabled=!0,t.computerGuessButton.textContent=r.noMoreTips)}function k(){document.body.classList.add(`modal-open`)}function A(){document.body.classList.remove(`modal-open`)}function j(){t.correctColorCode.textContent=_.generatedColor,k()}function M(){t.checkButton.disabled=!0,t.computerGuessButton.disabled=!0,t.allSecondaryButtons.forEach(e=>e.disabled=!0)}function N(){t.checkButton.disabled=!1,t.computerGuessButton.disabled=!1,t.allSecondaryButtons.forEach(e=>e.disabled=!1)}function P(e){let t=b[e];if(!t)return;let n=e=>{console.error(`Hangfájl hiba: `,e)};try{Promise.resolve(new Audio(t).play()).catch(n)}catch(e){n(e)}}function F(e){e?t.randomColor.classList.add(`pulsing`):t.randomColor.classList.remove(`pulsing`)}function I(){t.colorInput.value=``,t.userColor.style.backgroundColor=`#FFFFFF`,t.feedback.textContent=``,t.timer.textContent=`0`,E()}function L(){try{let e=d.getGameStatistics(),t=e.colorAccuracyHistory||[],n=e.totalGames,r=e.gamesWon,i=e.bestScore,a=t.length>0?t.reduce((e,t)=>e+t,0)/t.length:0,o=document.getElementById(`total-games`);o&&(o.textContent=n.toString());let s=document.getElementById(`win-rate`);if(s){let e=n>0?r/n*100:0;s.textContent=`${Math.round(e)}%`}let c=document.getElementById(`best-score`);c&&(c.textContent=i.toString());let l=document.getElementById(`avg-accuracy`);l&&(l.textContent=`${Math.round(a)}%`),console.log(`📈 Statistics updated:`,{totalGames:n,winRate:`${Math.round(r/n*100||0)}%`,bestScore:i,avgAccuracy:`${Math.round(a)}%`})}catch(e){console.error(`❌ Failed to update statistics:`,e),Object.entries({"total-games":`0`,"win-rate":`0%`,"best-score":`0`,"avg-accuracy":`0%`}).forEach(([e,t])=>{let n=document.getElementById(e);n&&(n.textContent=t)})}}function R(e,t=`info`,n=3e3){let r=document.createElement(`div`);r.className=`toast toast-${t}`;let i={success:`✅`,warning:`⚠️`,error:`❌`,info:`ℹ️`},a=document.createElement(`div`);a.className=`toast-content`;let o=document.createElement(`span`);o.className=`toast-icon`,o.textContent=i[t]||i.info;let s=document.createElement(`span`);if(s.className=`toast-message`,s.textContent=e,a.append(o,s),r.appendChild(a),r.style.cssText=`
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${z(t)};
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    max-width: 300px;
    animation: slideInRight 0.3s ease-out;
    font-weight: 500;
  `,!document.querySelector(`#toast-styles`)){let e=document.createElement(`style`);e.id=`toast-styles`,e.textContent=`
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
    `,document.head.appendChild(e)}document.body.appendChild(r),setTimeout(()=>{r.style.animation=`slideOutRight 0.3s ease-in`,setTimeout(()=>{r.parentElement&&r.remove()},300)},n)}function z(e){let t={success:`#28a745`,warning:`#ffc107`,error:`#dc3545`,info:`#17a2b8`};return t[e]||t.info}function B(e,t){let n=document.createElement(`div`);if(n.className=`achievement-notification`,n.innerHTML=`
    <div class="achievement-content">
      <div class="achievement-icon">🏆</div>
      <div class="achievement-text">
        <div class="achievement-title">Achievement Unlocked!</div>
        <div class="achievement-name"></div>
        <div class="achievement-desc"></div>
      </div>
    </div>
  `,n.querySelector(`.achievement-name`).textContent=e,n.querySelector(`.achievement-desc`).textContent=t,n.style.cssText=`
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
  `,!document.querySelector(`#achievement-styles`)){let e=document.createElement(`style`);e.id=`achievement-styles`,e.textContent=`
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
    `,document.head.appendChild(e)}document.body.appendChild(n),setTimeout(()=>{n.style.animation=`achievementPop 0.3s reverse`,setTimeout(()=>{n.parentElement&&n.remove()},300)},4e3)}function V(){_.timerInterval&&clearInterval(_.timerInterval),_.timerInterval=setInterval(T,1e3)}function H(){let e=Math.floor((Date.now()-_.startTime)/1e3),t=s[_.difficulty].score,n=Math.max(0,t-e);_.score+=n}function U(){if(!_.generatedColor||!t.colorInput.value)return 0;let e=`#`+t.colorInput.value.replace(`#`,``),n=_.generatedColor,r=i(e,n),a=Math.max(0,Math.min(100,100-r/100*100));return Math.round(a*100)/100}function W(e,t){if(e)try{let e=d.getGameStatistics(),n=d.getHighScores().scores;e.gamesWon===1&&B(`First Victory`,`Congratulations on your first successful color match!`),[5,10,25,50,100].includes(e.gamesWon)&&B(`${e.gamesWon} Wins`,`You've successfully completed ${e.gamesWon} games!`),n.length>0&&t===n[0].score&&B(`New High Score!`,`Amazing! You scored ${t} points!`),U()===100&&B(`Perfect Match`,`Incredible! You got the exact color!`),Date.now()-_.startTime<1e4&&B(`Lightning Fast`,`You completed the game in under 10 seconds!`),_.difficulty===`hard`&&B(`Hard Mode Master`,`Excellent work completing hard difficulty!`)}catch(e){console.error(`❌ Failed to check achievements:`,e)}}function G(e){clearInterval(_.timerInterval),_.isGameActive=!1;let t=Date.now()-_.startTime,n=_.difficulty,i=U(),a=s[n],o=a.computerTipCount-_.computerTipCount;e?(w(r.congratulations),P(`correct`),H(),E(),g(!0,_.score,t,n,i),d.recordGame({won:!0,score:_.score,time:t,difficulty:n,accuracy:i,targetColor:_.generatedColor,attempts:a.tipCount-_.tipCount+1,computerTipsUsed:o,timestamp:Date.now()}),console.log(`🎉 Game won!`,{score:_.score,time:`${Math.round(t/1e3)}s`,accuracy:`${i}%`,difficulty:n})):(w(r.sorry),P(`wrong`),g(!1,0,t,n,i),d.recordGame({won:!1,score:0,time:t,difficulty:n,accuracy:i,targetColor:_.generatedColor,attempts:a.tipCount,computerTipsUsed:o,timestamp:Date.now()}),console.log(`💔 Game lost`,{time:`${Math.round(t/1e3)}s`,accuracy:`${i}%`,difficulty:n,targetColor:_.generatedColor}));let c=e?_.score:0;m(`game-session`,{won:e,difficulty:n,score:c}),L(),W(e,c),e?R(`🎉 Congratulations! Score: ${c}`,`success`,4e3):R(`😔 Better luck next time! Target was ${_.generatedColor}`,`warning`,4e3),j(),M()}function K(){if(!_.isGameActive)return;let e=`#`+t.colorInput.value.replace(`#`,``),n=e.toUpperCase()===_.generatedColor,i=U();if(l.trackColorGuess(e,_.generatedColor,i,n),n)G(!0);else if(_.tipCount--,f(h.COLOR_GUESS,{attempt:s[_.difficulty].tipCount-_.tipCount,totalAttempts:s[_.difficulty].tipCount,accuracy:i,remainingTips:_.tipCount,difficulty:_.difficulty}),_.tipCount>0){let t=r.tryAgain(_.tipCount);t+=o(e,_.generatedColor),w(t),console.log(`🎯 Color guess: ${i}% accuracy, ${_.tipCount} tips remaining`)}else G(!1)}function q(){if(_.computerTipCount<=0||!_.isGameActive)return;let r=[{text:`Ez közel lehet!`,type:`close`},{text:`Ez csak egy tipp, ne bízz meg benne!`,type:`wrong`},{text:`Ez csak vicc volt!`,type:`silly`}],i=r[Math.floor(Math.random()*r.length)],a;switch(i.type){case`close`:a=n(_.generatedColor);break;case`wrong`:a=e();break;case`silly`:a=`#FFFFFF`}t.colorInput.value=a.replace(`#`,``),S(a),w(i.text),_.computerTipCount--,O()}function J(e,n){if(!_.isGameActive)return;let i=t.colorInput.value.replace(`#`,``);a(i)||(i=`000000`,w(r.invalidColor));let s=c(i,e,n);t.colorInput.value=s,t.colorAdjust.value=`#`+s,S(`#`+s),w(o(s,_.generatedColor)),D(s)}function Y(){v(),y(t.difficulty.value),I(),_.generatedColor=e(),C(_.generatedColor,r.memorizeColor),F(!0),M(),u(_.difficulty,_.generatedColor),p(`game-session`),_.memorizeTimeout=setTimeout(()=>{_.memorizeTimeout=null,C(`#FFFFFF`,``),F(!1),_.isGameActive=!0,P(`start`),N(),O(),_.startTime=Date.now(),V()},3e3)}export{A as a,S as c,Y as i,y as l,K as n,D as o,q as r,L as s,J as t};
//# sourceMappingURL=game-DsyV8_pB.js.map