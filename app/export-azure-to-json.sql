select '{' + 
'"id": "' + CONVERT(varchar(255), newid()) + '",' + 
'"prompt": "' +  replace(replace(replace(prompt,'\','\\'),'"','\"'),char(13),'\n') + '",' +
'"solution": "' + replace(replace(replace(solution,'\','\\'),'"','\"'),char(13),'\n') + '",' +
'"state": "' +  state + '",' +
'"changeTime": "' +  format(ChangeTime,N'yyyy-MM-ddTHH:mm:ss.000Z') + '",' +
'"lastTicks": ' + FORMAT(lastTicks, 'G', 'en-us')+ ',' +
'"nextTime": "' +  format(NextTime,N'yyyy-MM-ddTHH:mm:ss.000Z') + '"' +
'},' 
from tests
