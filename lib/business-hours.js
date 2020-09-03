var moment = require('moment'),
    minimatch = require('minimatch');

var localeData = require('../locale/default');
moment.updateLocale(moment.locale(), localeData);

function getLocaleData(key) {
    return moment.localeData()['_' + key];
}

function openingTimes(d) {
    d = d.clone();
    var hours = getLocaleData('workinghours');
    if (!d.isWorkingDay()) {
        return null;
    }
    return toWorkingTimeSegments(hours[d.day()].map(function (time) {
        time = time.split(':');
        var _d = d.clone();
        _d.hours(time[0]);
        _d.minutes(time[1] || 0);
        _d.seconds(time[2] || 0);
        _d.milliseconds(0);
        return _d;
    }));
}

function incrementDays(fn) {
    return function (n, d) {
        while (n) {
            d[fn](1, 'day');
            if (d.isWorkingDay()) {
                n--;
            }
        }
        return d;
    };
}

function addUnit(unit) {
    return function (n, d) {
        if (!d.isWorkingTime()) {
            d = d.nextWorkingTime();
        }
        var i = 0;
        while (n > 0) {
            var segment = openingTimes(d)[i];
            if (!segment || d.isBefore(segment[0])) {
                i = 0;
                continue;
            }
            if (d.isAfter(segment[1])) {
                i++;
                continue;
            }
            var jump = segment[1].diff(d, unit);
            if (jump > n) {
              jump = n;
            }
            if (jump < 1) {
              jump = 1;
            }
            var then = d.clone().add(jump, unit);
            n -= jump;
            if (then.isSameOrBefore(segment[1])) {
                d = d.add(jump, unit);
            } else {
                var next = then.nextWorkingTime();
                var diff = then.diff(segment[1], unit, true);
                d = next.add(diff,unit);
            }
        }
        return d;
    };
}

function subtractUnit(unit) {
    return function (n, d) {
        if (!d.isWorkingTime()) {
            d = d.lastWorkingTime();
        }
        var i = 0;
        while (n > 0) {
            var segment = openingTimes(d)[i];
            if (!segment || d.isBefore(segment[0])) {
                i = 0;
                continue;
            }
            if (d.isAfter(segment[1])) {
                i++;
                continue;
            }
            var jump = -1 * segment[0].diff(d, unit);
            if (jump > n) {
              jump = n;
            }
            if (jump < 1) {
              jump = 1;
            }
            var then = d.clone().subtract(jump, unit);
            n -= jump;
            if (then.isWorkingTime()) {
                d = d.subtract(jump, unit);
            } else {
                var next = then.lastWorkingTime();
                var diff = then.diff(segment[0], unit, true);
                d = next.add(diff,unit);
            }
        }
        return d;
    };
}

function copy(from, to) {
    ['year', 'month', 'date', 'hour', 'minute', 'second', 'millisecond'].forEach(function (unit) {
        to.set(unit, from.get(unit));
    });
    return to;
}


function add(d, num, unit) {

    if(num < 0){
        return subtract(d, -(num), unit);
    }

    unit = moment.normalizeUnits(unit);


    if (unit === 'day' ) {
        d = incrementDays('add')(num, d);
    // prevent calculation error when break between two working time segments is less than 1 hour
    } else if (unit === 'hour') {
        d = addUnit('minute')(num * 60, d);
    } else if (unit) {
        d = addUnit(unit)(num, d);
    }
    return d;
}

function subtract(d, num, unit) {

    if(num < 0){
        return add(d, -(num), unit);
    }
    unit = moment.normalizeUnits(unit);
    if (unit === 'day') {
        d = incrementDays('subtract')(num, d);
    // prevent calculation error when break between two working time segments is less than 1 hour
    } else if (unit === 'hour') {
        d = subtractUnit('minute')(num * 60, d);
    } else if (unit) {
        d = subtractUnit(unit)(num, d);
    }
    return d;
}

function addOrSubtractMethod(fn) {
    return function (num, unit) {
        if (typeof unit !== 'string') {
            throw new Error('unit must be defined');
        }
        if (typeof num !== 'number') {
            throw new Error('duration must be defined');
        }
        var args = [].slice.call(arguments);
        if (args.length % 2) {
            throw new Error('moment#(add/subtract)WorkingTime requires an even number of arguments');
        }

        var d = this;

        while (args.length >= 2) {
            d = fn.bind(null, d).apply(null, args.slice(-2));
            args = args.slice(0, -2);
        }

        return copy(d, this);
    };
}

function toWorkingTimeSegments(openingTimes) {
    return openingTimes.reduce(function (rows, key, index) {
        return (index % 2 === 0 ? rows.push([key])
          : rows[rows.length-1].push(key)) && rows;
      }, []);
}

moment.fn.addWorkingTime = addOrSubtractMethod(add);
moment.fn.subtractWorkingTime = addOrSubtractMethod(subtract);

moment.fn.isBusinessDay = function isBusinessDay() {
    var hours = getLocaleData('workinghours');
    return !!hours[this.day()] && !this.isHoliday();
};
moment.fn.isWorkingDay = moment.fn.isBusinessDay;

moment.fn.isWorkingTime = function isWorkingTime() {
    var segments = openingTimes(this);
    if (!segments) {
        return false;
    } else {
        var self = this;
        return segments.some(function(openinghours) {
            return self.isSameOrAfter(openinghours[0]) && self.isSameOrBefore(openinghours[1]);
        });
    }
};

moment.fn.isHoliday = function isHoliday() {
    var isHoliday = false,
        today = this.format('YYYY-MM-DD');
    (getLocaleData('holidays') || []).forEach(function (holiday) {
        if (minimatch(today, holiday)) {
            isHoliday = true;
        }
    });
    return isHoliday;
};

moment.fn.nextWorkingDay = function nextWorkingDay() {
    var d = this.clone();
    d = d.add(1, 'day');
    while (!d.isWorkingDay()) {
        d = d.add(1, 'day');
    }
    return d;
};

moment.fn.lastWorkingDay = function nextWorkingDay() {
    var d = this.clone();
    d = d.subtract(1, 'day');
    while (!d.isWorkingDay()) {
        d = d.subtract(1, 'day');
    }
    return d;
};

moment.fn.nextWorkingTime = function nextWorkingTime() {
    if (this.isWorkingDay()) {
        var segments = openingTimes(this);
        var openinghours, lastSegment;
        for(i = 0; i < segments.length; i++) {
            openinghours = segments[i];
            lastSegment = i === segments.length -1;
            if (this.isBefore(openinghours[0])) {
                return openinghours[0];
            } else if (this.isAfter(openinghours[1])) {
                if (!lastSegment) {
                    continue;
                }
                return openingTimes(this.nextWorkingDay())[0][0];
            } else {
                return this.clone();
            }
        }
    } else {
        return openingTimes(this.nextWorkingDay())[0][0];
    }
};

moment.fn.nextTransitionTime = function nextTransitionTime() {
    if (this.isWorkingDay()) {
        var segments = openingTimes(this);
        var openinghours, lastSegment;
        for(i = 0; i < segments.length; i++) {
            openinghours = segments[i];
            lastSegment = i === segments.length -1;
            if (this.isBefore(openinghours[0])) {
                return {'transition': 'open','moment':openinghours[0]};
            } else if (this.isBefore(openinghours[1])) {
                return {'transition':'close','moment':openinghours[1]};
            } else if (this.isAfter(openinghours[1])) {
                if (!lastSegment) {
                    continue;
                }
                return {'transition':'open','moment':openingTimes(this.nextWorkingDay())[0][0]};
            }
        }
    } else {
        return {'transition':'open','moment':openingTimes(this.nextWorkingDay())[0][0]};
    }
}

moment.fn.lastWorkingTime = function nextWorkingTime() {
    if (this.isWorkingDay()) {
        var segments = openingTimes(this);
        var openinghours, firstSegment;
        for(i = segments.length - 1; i >= 0; i--) {
            openinghours = segments[i];
            firstSegment = i === 0;
            if (this.isAfter(openinghours[1])) {
                return openinghours[1];
            } else if (this.isBefore(openinghours[0])) {
                if (!firstSegment) {
                    continue;
                }
                return openingTimes(this.lastWorkingDay()).slice(-1)[0][1];
            } else {
                return this.clone();
            }
        }
    } else {
        return openingTimes(this.lastWorkingDay()).slice(-1)[0][1];
    }
};

moment.fn.lastTransitionTime = function lastTransitionTime() {
    if (this.isWorkingDay()) {
        var segments = openingTimes(this);
        var openinghours, firstSegment;
        for(i = segments.length - 1; i >= 0; i--) {
            openinghours = segments[i];
            firstSegment = i === 0;
            if (this.isAfter(openinghours[1])) {
                return {'transition':'close','moment':openinghours[1]};
            } else if (this.isAfter(openinghours[0])) {
                return {'transition':'open','moment':openinghours[0]};
            } else if (this.isBefore(openinghours[0])) {
                if (!firstSegment) {
                    continue;
                }
                return {'transition':'close','moment':openingTimes(this.lastWorkingDay()).slice(-1)[0][1]};
            }
        }
    } else {
        return {'transition':'close','moment':openingTimes(this.lastWorkingDay()).slice(-1)[0][1]};
    }
}

moment.fn.workingDiff = function workingDiff(comparator, unit, detail) {
    unit = unit || 'milliseconds';
    unit = moment.normalizeUnits(unit);

    comparator = moment(comparator);

    if (['year', 'month', 'week'].indexOf(unit) > -1) {
        return this.diff(comparator, unit, detail);
    }

    // ensure `from` is always before `to`
    var from, to, diff = 0, multiplier = 1;
    if (this.isAfter(comparator)) {
        to = this.clone();
        from = comparator.clone();
        multiplier = -1;
    } else {
        to = comparator.clone();
        from = this.clone();
    }

    // normalise to nearest working times
    if (!from.isWorkingTime()) {
        from = from.nextWorkingTime();
    }
    if (!to.isWorkingTime()) {
        to = to.lastWorkingTime();
    }

    // if `from` is now after `to` then we have two timestamps on the same night, so diff is zero
    if (from.isAfter(to)) {
        return 0;
    }

    if (unit === 'day') {
        // iterate to the same day
        while(!from.isSame(to, 'day')) {
            diff--;
            from = from.addWorkingTime(1, 'day');
        }
        if (detail) {
            if (process.env.NODE_ENV !== 'production') {
                console.warn('WARNING: passing `true` as a third argument to `workingDiff` may lead to ambiguous results');
                console.warn('See https://github.com/lennym/moment-business-time/issues/12#issuecomment-199710566');
            }
            var hours = from.diff(to, 'hour', true),
                denominator = comparator.isWorkingDay() ? comparator : comparator.nextWorkingDay(),
                total = openingTimes(denominator).slice(-1)[0][1].diff(openingTimes(denominator)[0][0], 'hour', true);
            diff += hours/total;
        }

    } else {
        var segments = openingTimes(from);
        while (from.isBefore(to)) {
            for (var i = 0; i < segments.length; i++) {
                var segment = segments[i];
                if (from.isAfter(segment[1])) {
                    continue;
                }
                diff += moment.max(from, segment[0]).diff(moment.min(segment[1], to), unit, true);
            }
            segments = openingTimes(from.nextWorkingDay());
            from = segments[0][0];
        }
    }

    if(!detail) {
        diff = diff < 0 ? Math.ceil(diff) : Math.floor(diff);
    }

    return multiplier * diff;

};


module.exports = moment;
