// Brief, non-modal human answers; never inferred from app behaviour.
export const FEEDBACK_PREF_KEY='roygbiv:creative-feedback-frequency:v1';
export const FEEDBACK_COUNT_KEY='roygbiv:creative-feedback-counter:v1';
export const CREATIVE_FEEDBACK_OPTIONS=['every','occasionally','never'];
export function shouldOfferCreativeQuestion(kind,{frequency='every',manualEdits=0,
  engagedMs=0,finalExported=false,eligibleCount=1}={}){
  if(!CREATIVE_FEEDBACK_OPTIONS.includes(frequency)||frequency==='never')
    return false;
  if(kind==='superseded'&&
    (manualEdits<3||engagedMs<45000||finalExported))return false;
  if(kind!=='export'&&kind!=='superseded')return false;
  return frequency==='every'||eligibleCount%3===1;
}
export function installCreativeFeedback({recorder,getRecipe}){
  const panel=document.createElement('section');
  panel.id='creativeFeedback';panel.className='creative-feedback';
  panel.hidden=true;
  panel.setAttribute('aria-label','Optional feedback about your wallpaper');
  panel.innerHTML=`<div class="creative-feedback-title">
      <strong data-feedback-title></strong>
      <button type="button" data-feedback-close aria-label="Dismiss feedback">Skip</button>
    </div>
    <p data-feedback-question></p>
    <div class="creative-feedback-answers" data-feedback-answers></div>
    <button type="button" class="creative-feedback-never" data-feedback-never>Don't ask again</button>`;
  document.body.append(panel);
  const title=panel.querySelector('[data-feedback-title]');
  const question=panel.querySelector('[data-feedback-question]');
  const answers=panel.querySelector('[data-feedback-answers]');
  let active=null;
  function preference(){
    try{return localStorage.getItem(FEEDBACK_PREF_KEY)||'every';}
    catch{return 'every';}
  }
  function hide(){panel.hidden=true;active=null;}
  function respond(answer){
    if(!active)return;
    recorder.action(answer==='skip'?'survey_skipped':'survey_answer',getRecipe(),{
      surveyKind:active.kind,targetEpisodeId:active.targetEpisodeId,
      ...(active.exportId?{exportId:active.exportId}:{}),
      ...(answer!=='skip'?{answer}:{})
    });
    hide();
  }
  panel.querySelector('[data-feedback-close]').addEventListener('click',()=>respond('skip'));
  panel.querySelector('[data-feedback-never]').addEventListener('click',()=>{
    try{localStorage.setItem(FEEDBACK_PREF_KEY,'never');}catch{}
    respond('skip');
  });
  function offer(kind,details={}){
    if(!recorder.enabled||preference()==='never')return false;
    let count=1;
    try{
      count=Number(localStorage.getItem(FEEDBACK_COUNT_KEY)||0)+1;
      if(!Number.isSafeInteger(count)||count<1)count=1;
      localStorage.setItem(FEEDBACK_COUNT_KEY,String(count));
    }catch{}
    if(!shouldOfferCreativeQuestion(kind,{frequency:preference(),eligibleCount:count,...details}))
      return false;
    active={kind,targetEpisodeId:details.targetEpisodeId,
      exportId:details.exportId};
    title.textContent=kind==='export'?'A question about this export':'One quick question';
    question.textContent=kind==='export'?
      'How close was that wallpaper to what you wanted?':
      'What happened to the design you just replaced?';
    const choices=kind==='export'?
      [['exact','Exactly what I wanted'],['close','Pretty close'],
        ['exploring','Just exploring'],['not-yet','Not there yet']]:
      [['exploring','Just trying things'],['new-direction','Wanted a different direction'],
        ['could-not-achieve','Could not get the result'],['accidental','Changed accidentally'],
        ['saved-elsewhere','Saved it another way']];
    answers.replaceChildren();
    for(const [id,label] of choices){
      const button=document.createElement('button');
      button.type='button';button.textContent=label;
      button.addEventListener('click',()=>respond(id));
      answers.append(button);
    }
    panel.hidden=false;
    recorder.action('survey_offered',getRecipe(),{surveyKind:kind,
      targetEpisodeId:details.targetEpisodeId,
      ...(details.exportId?{exportId:details.exportId}:{})});
    return true;
  }
  return {
    showExport:details=>offer('export',details),
    showSuperseded:details=>offer('superseded',details),
    hide
  };
}
