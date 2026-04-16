
import dayjs from "dayjs";
import updateLocale from "dayjs/plugin/updateLocale";

dayjs.extend(updateLocale);

dayjs.updateLocale('en', {
    weekStart: 1, // Set Monday as the first day of the week
})


export default dayjs;
