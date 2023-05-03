import { Camera, Canvas, Collider, GameObject, Object, Transform } from 'UnityEngine'
import { UnityEvent } from 'UnityEngine.Events';
import { Button } from 'UnityEngine.UI';
import { ZepetoPlayers } from 'ZEPETO.Character.Controller';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class InteractionIcon extends ZepetoScriptBehaviour {

    // Icon
    @Header("[Icon]")
    @SerializeField() private PrefIconCanvas: GameObject;   // 아이콘 캔버스 프리팹
    @SerializeField() private IconPos: Transform;           // 아이콘의 위치

    // Unity Event
    @Header("[Unity Event]")
    public OnClickEvent: UnityEvent;
    public OnTriggerEnterEvent: UnityEvent;
    public OnTriggerExitEvent: UnityEvent;

    private _button: Button;
    private _canvas: Canvas;
    private _cacheWorldCamera: Camera;
    private _isIconActive: boolean = false;
    private _isDoneFirstTrig: boolean = false;

    private Update() {
        if (this._isDoneFirstTrig && this._canvas?.gameObject.activeSelf) {
            this.UpdateIconRotation();  // 아이콘 캔버스를 카메라 회전에 맞게 회전
        }
    }

    // 콜라이더 영역 내로 캐릭터가 들어온 경우, 즉 충돌하는 순간 호출
    private OnTriggerEnter(coll: Collider) {
        // 상호작용 가능 범위(콜라이더 영역 내)에 들어온 객체가 플레이어가 아니면, 함수 종료
        if (coll != ZepetoPlayers.instance.LocalPlayer?.zepetoPlayer?.character.GetComponent<Collider>()) {
            return;
        }

        // 맞으면, 상호작용 아이콘 활성화
        this.ShowIcon();
        this.OnTriggerEnterEvent?.Invoke();
    }

    // 콜라이더 영역 밖으로 캐릭터가 나온 경우, 즉 충돌한 후 떼어지는 순간 호출
    private OnTriggerExit(coll: Collider) {
        if (coll != ZepetoPlayers.instance.LocalPlayer?.zepetoPlayer?.character.GetComponent<Collider>()) {
            return;
        }

        this.HideIcon();    // 상호작용 아이콘 비활성화
        this.OnTriggerExitEvent?.Invoke();
    }

    // 아이콘 보이기
    public ShowIcon() {
        // 첫 실행 시 아이콘이 없는 경우, 아이콘 먼저 생성
        if (!this._isDoneFirstTrig) {
            this.CreateIcon();
            this._isDoneFirstTrig = true;
        } else {
            this._canvas.gameObject.SetActive(true);
        }

        this._isIconActive = true;
    }

    // 아이콘 숨기기
    public HideIcon() {
        this._canvas?.gameObject.SetActive(false);
        this._isIconActive = false;
    }

    private CreateIcon() {
        // 하이어라키 뷰에 Canvas가 없으므로, 첫 실행 시는 undefined
        // 따라서 미리 만든 프리팹을 통해 새 캔버스와 버튼을 만들어 준다.
        if (this._canvas === undefined) {
            const canvas = GameObject.Instantiate(this.PrefIconCanvas, this.IconPos) as GameObject;

            this._canvas = canvas.GetComponent<Canvas>();
            this._button = canvas.GetComponentInChildren<Button>();
            this._canvas.transform.position = this.IconPos.position;
        }

        this._cacheWorldCamera = Object.FindObjectOfType<Camera>();
        this._canvas.worldCamera = this._cacheWorldCamera;

        this._button.onClick.AddListener(() => {
            this.OnClickIcon();
        });
    }

    private UpdateIconRotation() {
        this._canvas.transform.LookAt(this._cacheWorldCamera.transform);
    }

    private OnClickIcon() {
        this.OnClickEvent?.Invoke();
    }
}