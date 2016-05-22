BBIT = typeof BBIT !== "undefined" ? BBIT : {};
BBIT.time = {
    monthNames: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ],
    weekdays: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ],
    date: function(input){
        var date;
        if (typeof input === "number") {
            var milli = parseInt(input) * 1000;
            date = new Date(milli);
        }
        else if (typeof input === "string") {
            date = new Date(Date.parse(input));
        }
        else {
            date = new Date();
        }
        
        var dateObj = {};
        dateObj.DOW = date.getDay();
        dateObj.day = date.getDate();
        dateObj.dayLZ = dateObj.day < 10 ? '0' + dateObj.day : dateObj.day;
        dateObj.dateString = date.toLocaleDateString();
        dateObj.dateTimeString = date.toLocaleString();
        dateObj.month = (date.getMonth()+1);
        dateObj.monthLZ = dateObj.month < 10 ? '0' + dateObj.month : dateObj.month;
        dateObj.monthName = this.monthNames[dateObj.month - 1];
        dateObj.timestamp = Math.floor(date.getTime()/1000);
        dateObj.timeString = date.toLocaleTimeString();
        dateObj.weekday = this.weekdays[dateObj.DOW];
        dateObj.year = date.getFullYear();
        
        return dateObj;
    }
};
