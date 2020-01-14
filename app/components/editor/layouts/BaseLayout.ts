import TsxComponent from 'components/tsx-component';
import { Watch } from 'vue-property-decorator';
import { LayoutSlot, IVec2Array } from 'services/layout';
import BaseElement from 'components/editor/elements/BaseElement';

export class LayoutProps {
  resizeStartHandler: () => void = () => {};
  resizeStopHandler: () => void = () => {};
  calculateMin: (slots: IVec2Array) => number = () => 0;
  calculateMax: (mins: number) => number = () => 0;
  setBarResize: (bar: 'bar1' | 'bar2', size: number, mins?: IResizeMins) => void = () => {};
  windowResizeHandler: (mins: IResizeMins, isChat?: boolean) => void = () => {};
  resizes: { bar1: number; bar2: number } = null;
  elWidth: number = 0;
}

export interface IResizeMins {
  rest: number;
  bar1: number;
  bar2?: number;
}

interface ILayoutSlotArray extends Array<ILayoutSlotArray | LayoutSlot> {}

export default class BaseLayout extends TsxComponent<LayoutProps> {
  mins: IResizeMins = { rest: null, bar1: null };

  mountResize() {
    window.addEventListener('resize', () => this.props.windowResizeHandler(this.mins));
    if (this.bar1 < this.mins.bar1) this.props.setBarResize('bar1', this.mins.bar1);
    if (this.mins.bar2 && this.bar2 < this.mins.bar2) {
      this.props.setBarResize('bar2', this.mins.bar2);
    }
    this.props.windowResizeHandler(this.mins);
  }
  destroyResize() {
    window.removeEventListener('resize', () => this.props.windowResizeHandler(this.mins));
  }

  async setMins(
    restSlots: ILayoutSlotArray,
    bar1Slots: ILayoutSlotArray,
    bar2Slots?: ILayoutSlotArray,
  ) {
    console.log('firing setMins');
    const rest = await this.calculateMin(restSlots);
    const bar1 = await this.calculateMin(bar1Slots);
    const bar2 = await this.calculateMin(bar2Slots);
    this.mins = { rest, bar1, bar2 };
  }

  async minsFromSlot(slot: LayoutSlot) {
    await this.$nextTick();
    return (this.$slots[slot][0].componentInstance as BaseElement).mins;
  }

  async calculateMin(slots: ILayoutSlotArray) {
    console.log('firing calculateMin', slots);
    if (!slots) return;
    const mins = await this.mapVectors(slots);
    console.log(mins);
    return this.props.calculateMin(mins);
  }

  async mapVectors(slots: ILayoutSlotArray): Promise<IVec2Array> {
    return await Promise.all(
      slots.map(async slot => {
        if (Array.isArray(slot)) return await this.mapVectors(slot);
        return await this.minsFromSlot(slot);
      }),
    );
  }

  get totalWidth() {
    return this.props.elWidth;
  }

  @Watch('totalWidth')
  updateSize() {
    this.props.windowResizeHandler(this.mins, true);
  }

  get bar1(): number {
    return null;
  }
  get bar2(): number {
    return null;
  }
}
