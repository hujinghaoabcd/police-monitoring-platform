var Person=require('../models/person'),
    List=require('../models/list')

var tools=require('../models/tools')

module.exports=function(app){
  //创建文档保存paperOne数据并记录startTime
  app.post('/paperOne',(req,res,next)=>{
    var paper=req.body,
        schema={
          paperOne:paper,
          startTime:Date.now()//毫秒数
        }

    var newList=new List(schema)

    newList.save((err)=>{
      if(err){
        console.error(err)
      }
      res.json({
        success:1,
        msg:'问卷信息保存成功'
      })
    })
  })

  //web端设置心跳抓取listStatus=0的list对象数组
  app.post('/getWantedList',(req,res,next)=>{
    var find=List.prototype.find

    find({listStatus:0},(err,lists)=>{
      if(err){
        console.error(err)
      }

      if(lists.length){
        res.json({
          success:1,
          lists
        })
      }else{
        res.json({
          success:0,
          msg:'暂时没有未处理的订单'
        })
      }
    })
  })

  //web端设置心跳抓取status=0的person对象数组(抓取空闲的民警)
  app.post('/getfreePolice',(req,res,next)=>{
    var find=Person.prototype.find

    find({status:0},(err,persons)=>{
      if(err){
        console.error(err)
      }

      if(persons.length){
        res.json({
          success:1,
          persons:persons
        })
      }else{
        res.json({
          success:0,
          msg:'目前没有空闲的民警'
        })
      }
    })
  })

  //web端忽略未处理的订单
  app.post('/ignoreList',(req,res,next)=>{
    var update=List.prototype.update
    var searchObj={
          _id:req.body._id
        },
        updateObj={
          listStatus:4,
          endTime:Date.now()
        }
    var success='案件忽略成功',
        error='案件失败'

    update(searchObj,updateObj,(err,result)=>{
      if(err){
        console.error(err)
      }

      if(result.nModified){
        res.json({
          success:1,
          msg:success
        })
      }else{
        res.json({
          success:0,
          msg:error
        })
      }
    })
  })

  //web端委派未处理的订单
  app.post('/delegate',(req,res,next)=>{
    var filter=req.body
    var listUpdate=List.prototype.update,
        personUpdate=Person.prototype.update

    listUpdate({_id:filter._id},{listStatus:1,sendTime:Date.now(),policeName:filter.policeName},(err,result)=>{
      if(err){
        console.error(err)
      }

      if(result.nModified){//订单状态修改成功
        personUpdate({name:filter.policeName,type:1},{status:1},(err,result)=>{
          if(err){
            console.error(err)
          }

          if(result.nModified){
            res.json({
              success:1,
              msg:'民警状态及案件状态修改成功'
            })
          }else{
            res.json({
              success:0,
              msg:'民警状态修改失败'
            })
          }
        })
      }else{
        res.json({
          success:0,
          msg:'未匹配到符合该_id值的list对象或该list对象listStatus已经为1'
        })
      }
    })
  })

  /*
   * 更改民警状态
  */

  //获取分配给自己（该民警）的任务
  app.post('/getMission',(req,res,next)=>{
    var findOne=List.prototype.findOne
    var searchObj={
      policeName:req.body.policeName,
      listStatus:1
    }

    findOne(searchObj,(err,list)=>{
      if(err){
        console.error(err)
      }

      if(list){
        delete list.paperOne
        delete list.paperTwo
        res.json({
          success:1,
          list
        })
      }else{
        res.json({
          success:0,
          msg:'当前民警未分配任务'
        })
      }
    })
  })

  app.post('/confirmMission',(req,res,next)=>{
    tools.changePoliceStatus(res,req.body.policeName,2,'confirmTime')
  })

  app.post('/policeArrive',(req,res,next)=>{
    tools.changePoliceStatus(res,req.body.policeName,3,'arriveTime')
  })

  app.post('/policeSolved',(req,res,next)=>{
    tools.changePoliceStatus(res,req.body.policeName,0,'solvedTime',true)
  })

  app.post('/paperTwo',(req,res,next)=>{
    var update=List.prototype.update
    var paper=req.body,
        schema={
          paperTwo:paper,
          endTime:Date.now()
        }
    var listId=paper.id//从反馈表单对象中取出的list对象id

    update({_id:listId,listStatus:2},{listStatus:3},(err,result)=>{
      if(err){
        console.error(err)
      }

      if(result.nModified){
        res.json({
          success:1,
          msg:'订单评价成功'
        })
      }else{
        res.json({
          success:0,
          msg:'该订单已评价'
        })
      }

    })
  })

}