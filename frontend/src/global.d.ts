declare module 'duration' {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types

  export default class Duration {
    constructor(from: Date);
    constructor(from: Date, to: Date);

    /**
     * Returns full years of the duration
     */
    years: number;
    /**
     * Returns full months of the duration
     */
    months: number;
    /**
     * Returns full days of the duration
     */
    days: number;
    /**
     * Returns full hours of the duration
     */
    hours: number;
    /**
     * Returns full seconds of the duration
     */
    seconds: number;
    /**
     * Returns full minutes of the duration
     */
    minutes: number;
    /**
     * Returns milliseconds of the duration
     */
    milliseconds: number;
    /**
     * Same as years. Returns full years of the duration
     */
    year: number;
    /**
     * Returns trailing months of the duration
     */
    month: number;
    /**
     * Returns trailing days of the duration
     */
    day: number;
    /**
     * Returns trailing hours of the duration
     */
    hour: number;
    /**
     * Returns trailing minutes of the duration
     */
    minute: number;
    /**
     * Returns trailing seconds of the duration
     */
    second: number;
    /**
     * Returns trailing milliseconds of the duration
     */
    millisecond: number;
    /**
     * Same as `milliseconds`. Returns milliseconds of the duration
     */
    valueOf(): number;
    /**
     * Returns readable representation of the duration.
     * When invoked without arguments (defaults to _mode=0_), returns as:
     *
     *     10y 2m 6d 03:23:08.456
     *
     * When invoked with mode `1`, returns alternative representation:
     *
     *     10y 2m 6d 3h 23m 8s 456ms
     *
     * Representation returned by default modes can be customized with threshold setting that trims lowest units:
     *
     * ```javascript
     * duration.toString(); // 10y 2m 6d 03:23:08.456
     * duration.toString(0, 1); // 10y 2m 6d 03:23:08
     * duration.toString(0, 2); // 10y 2m 6d 03:23
     * duration.toString(1); // 10y 2m 6d 3h 23m 8s 456ms
     * duration.toString(1, 1); // 10y 2m 6d 3h 23m 8s
     * duration.toString(1, 2); // 10y 2m 6d 3h 23m
     * ```
     */
    toString(mode: number, threshold: number): string;

    /**
     * When invoked with string, formats the duration according to given pattern, where:
     * -   `%y` - `duration.year`
     * -   `%m` - `duration.month`
     * -   `%d` - `duration.day`
     * -   `%H` - `duration.hour`
     * -   `%M` - `duration.minute`
     * -   `%S` - `duration.second`
     * -   `%L` - `duration.millisecond`
     * -   `%ms` - `duration.months`
     * -   `%ds` - `duration.days`
     * -   `%Hs` - `duration.hours`
     * -   `%Ms` - `duration.minutes`
     * -   `%Ss` - `duration.seconds`
     * -   `%Ls` - `duration.milliseconds`
     * -   `%sign` - If duration is negative outputs `-` otherwise empty string
     */
    toString(format: string): string;
  }
}
