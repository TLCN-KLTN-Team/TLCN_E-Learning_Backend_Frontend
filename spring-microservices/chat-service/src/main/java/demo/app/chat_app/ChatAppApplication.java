package demo.app.chat_app;

import demo.app.chat_app.config.InitConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableFeignClients
@EnableKafka
@EnableScheduling
public class ChatAppApplication {

	public static void main(String[] args) {
		InitConfig.init();
		SpringApplication.run(ChatAppApplication.class, args);
	}

}
