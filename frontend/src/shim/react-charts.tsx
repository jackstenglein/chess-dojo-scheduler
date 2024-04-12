import { ChartOptions } from "chart.js";
import { ComponentPropsWithoutRef } from "react";

export type AxisOptions = {}

export type Datum = {}

export function Chart() {
    return <div>hi</div>
}

/*
export function Chart<TDatum>({ options: userOptions, className, style, ...rest }: ComponentPropsWithoutRef<'div'> & {
    options: ChartOptions<TDatum>;
}): JSX.Element;
*/
