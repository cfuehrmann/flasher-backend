select '{' + 
'"id": "' + CONVERT(varchar(255), newid()) + '",' + 
'"prompt": "' +  replace(prompt,'"','\"') + '",' +
'"solution": "' + replace(replace(replace(solution,'\','\\'),'"','\"'),char(13),'\n') + '",' +
'"state": "' +  state + '",' +
'"changeTime": "' +  format(ChangeTime,N'yyyy-MM-ddThh:mm:ss.000Z') + '",' +
'"lastTicks": ' + FORMAT(lastTicks, 'G', 'en-us')+ ',' +
'"nextTime": "' +  format(NextTime,N'yyyy-MM-ddThh:mm:ss.000Z') + '"' +
'},' 
from tests