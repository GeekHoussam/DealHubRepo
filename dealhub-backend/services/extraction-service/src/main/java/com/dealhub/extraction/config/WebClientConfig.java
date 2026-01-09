package com.dealhub.extraction.config;

import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;

@Configuration
public class WebClientConfig {

    @Bean
    public WebClient dealhubGatewayWebClient(
            WebClient.Builder builder,
            @Value("${dealhub.gateway.base-url}") String baseUrl,
            @Value("${dealhub.http.connect-timeout-ms:3000}") int connectTimeoutMs,
            @Value("${dealhub.http.read-timeout-ms:10000}") int readTimeoutMs,
            @Value("${dealhub.http.max-in-memory-size-mb:50}") int maxInMemorySizeMb
    ) {
        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, connectTimeoutMs)
                .responseTimeout(Duration.ofMillis(readTimeoutMs))
                .doOnConnected(conn -> conn
                        .addHandlerLast(new ReadTimeoutHandler((int) Math.ceil(readTimeoutMs / 1000.0)))
                        .addHandlerLast(new WriteTimeoutHandler((int) Math.ceil(readTimeoutMs / 1000.0)))
                );

        int maxBytes = maxInMemorySizeMb * 1024 * 1024;

        ExchangeStrategies strategies = ExchangeStrategies.builder()
                .codecs(cfg -> cfg.defaultCodecs().maxInMemorySize(maxBytes))
                .build();

        return builder
                .baseUrl(baseUrl)
                .exchangeStrategies(strategies)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();
    }
}
