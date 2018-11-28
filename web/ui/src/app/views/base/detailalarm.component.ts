import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ElasticsearchService } from '../../elasticsearch.service';

@Component({
  templateUrl: './detailalarm.component.html',
})
export class DetailalarmComponent implements OnInit {
  private sub: any;
  private alarmID;
  public alarm = [];
  private static readonly ALARM_INDEX = 'siem_alarms';
  private static readonly TYPE = 'doc';

  constructor(private route: ActivatedRoute, private es: ElasticsearchService) { }

  ngOnDestroy(){
    this.sub.unsubscribe();
  }

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.alarmID = params['alarmID'];
      this.getAlarmDetail(this.alarmID);
    })
  }

  async getAlarmDetail(alarmID){
    let resp = await this.es.getAlarms(DetailalarmComponent.ALARM_INDEX, DetailalarmComponent.TYPE, alarmID)
    var tempAlarms = resp.hits.hits;
    await Promise.all(tempAlarms.map(async (e) => {
      await Promise.all(e["_source"]["rules"].map(async (r) => {
        if (r["status"] == "finished") {
          r["events_count"] = r["occurrence"]
          Promise.resolve()
        } else {
          let response = await this.es.countEvents("siem_alarm_events-*", alarmID, r["stage"])
          r["events_count"] = response.count  
        }
      }))
    }))
    this.alarm = tempAlarms;
  }

}