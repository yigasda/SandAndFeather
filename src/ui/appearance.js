import { settings, saveSettings, UI_THEMES } from '../core/settings.js';
import { stack, para } from './kit.js';

export function appearanceCard(ui, apply) {
    const choices=document.createElement('div'); choices.className='sf_theme_choices';
    choices.setAttribute('role','radiogroup');choices.setAttribute('aria-label','UI 테마');
    for(const theme of UI_THEMES) {
        const b=document.createElement('button');b.type='button';b.className='sf_theme_choice';
        b.dataset.theme=theme.id;b.setAttribute('role','radio');
        b.setAttribute('aria-checked',String(settings().uiTheme===theme.id));
        b.tabIndex=settings().uiTheme===theme.id?0:-1;
        const swatches=document.createElement('span');swatches.className='sf_theme_swatches';swatches.setAttribute('aria-hidden','true');
        for(const color of theme.colors){const swatch=document.createElement('i');swatch.style.background=color;swatches.append(swatch);}
        const label=document.createElement('b');label.textContent=theme.label;
        const about=document.createElement('small');about.textContent=theme.about;
        b.append(swatches,stack(label,about));
        b.addEventListener('click',()=>{
            settings().uiTheme=theme.id;saveSettings();apply();
            for(const button of choices.children){button.setAttribute('aria-checked',String(button===b));button.tabIndex=button===b?0:-1;}
        });choices.append(b);
    }
    choices.addEventListener('keydown',event=>{
        const buttons=[...choices.children],index=buttons.indexOf(document.activeElement);
        if(index<0)return;
        const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:
            ['ArrowRight','ArrowDown'].includes(event.key)?(index+1)%buttons.length:
            ['ArrowLeft','ArrowUp'].includes(event.key)?(index+buttons.length-1)%buttons.length:-1;
        if(next>=0){event.preventDefault();event.stopPropagation();buttons[next].focus();buttons[next].click();}
    });
    const label=document.createElement('label');label.className='sf_brightness';label.append('밝기');
    const select=document.createElement('select');select.setAttribute('aria-label','밝기');
    for(const [value,text]of [['auto','자동'],['light','밝게'],['dark','어둡게']]){const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option);}
    select.value=settings().theme;
    select.addEventListener('change',()=>{settings().theme=select.value;saveSettings();apply();});label.append(select);
    return ui.showCard({title:'화면 설정',kind:'appearance',body:stack(para('원하는 분위기를 골라 봐. 선택은 자동으로 저장돼.'),choices,label)});
}
